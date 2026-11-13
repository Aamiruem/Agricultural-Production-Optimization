"""Tools shared by the multi-agent system and the MCP server.

Each tool is a plain, typed Python function with validated inputs, so it can be
called by an agent, exposed over MCP, or unit-tested directly.
"""
from __future__ import annotations

import json
import urllib.parse
import urllib.request
from functools import lru_cache

import joblib
import pandas as pd

from AIML.config import FEATURES, MODEL_BUNDLE_PATH, YIELD_MODEL_PATH
from AIML.preprocessing.yield_features import CATEGORICAL, NUMERIC

# Crop nutrient targets (kg/ha) used by the fertilizer tool.
NPK_TARGETS = {"rice": (80, 48, 40), "wheat": (120, 60, 40), "maize": (78, 48, 20), "cotton": (118, 46, 20),
               "chickpea": (40, 68, 80), "mustard": (80, 40, 40), "sugarcane": (150, 60, 60), "potato": (150, 80, 100)}


@lru_cache(maxsize=2)
def _bundle(path: str):
    return joblib.load(path)


def recommend_crop(N: float, P: float, K: float, temperature: float, humidity: float, ph: float, rainfall: float) -> dict:
    """Top-3 crops for soil N-P-K, pH, temperature (°C), humidity (%) and rainfall (mm) from the trained model."""
    b = _bundle(str(MODEL_BUNDLE_PATH))
    row = pd.DataFrame([[N, P, K, temperature, humidity, ph, rainfall]], columns=FEATURES)
    probs = b["model"].predict_proba(row)[0]
    top = sorted(zip(b["classes"], probs), key=lambda x: -x[1])[:3]
    return {"model": b["name"], "top": [{"crop": c, "probability": round(float(p), 3)} for c, p in top]}


def predict_yield(crop: str, season: str, state: str, year: int, area_ha: float,
                  annual_rainfall: float | None = None) -> dict:
    """Expected yield (t/ha) and production (t) from the trained yield model."""
    import numpy as np

    b = _bundle(str(YIELD_MODEL_PATH))
    rain = annual_rainfall or b["defaults"]["rainfall_by_state"].get(state, 1200.0)
    row = pd.DataFrame([{
        "Crop": crop, "Season": season, "State": state, "Crop_Year": year, "log_area": float(np.log1p(area_ha)),
        "Annual_Rainfall": rain, "fertilizer_kg_ha": b["defaults"]["fertilizer_kg_ha"],
        "pesticide_kg_ha": b["defaults"]["pesticide_kg_ha"]}])[CATEGORICAL + NUMERIC]
    y = max(float(b["model"].predict(row)[0]), 0.0)
    return {"yield_t_ha": round(y, 3), "production_t": round(y * area_ha, 1),
            "history": b["history"].get(f"{crop}|{state}|{season}")}


def fertilizer_plan(crop: str, N: float, P: float, K: float, area_ha: float = 1.0) -> dict:
    """DAP / Urea / MOP doses (kg) to close the gap between soil N-P-K and the crop's target."""
    crop = crop.lower()
    if crop not in NPK_TARGETS:
        raise ValueError(f"no nutrient target for '{crop}'; known: {sorted(NPK_TARGETS)}")
    tn, tp, tk = NPK_TARGETS[crop]
    n_def, p_def, k_def = max(tn - N, 0), max(tp - P, 0), max(tk - K, 0)
    dap = p_def / 0.46
    urea = max(n_def - dap * 0.18, 0) / 0.46
    mop = k_def / 0.60
    return {"crop": crop, "area_ha": area_ha,
            "kg_total": {"DAP": round(dap * area_ha, 1), "Urea": round(urea * area_ha, 1), "MOP": round(mop * area_ha, 1)}}


def weather_forecast(latitude: float, longitude: float, days: int = 5) -> dict:
    """Daily forecast (Open-Meteo): max/min temperature, rain, ET0, wind."""
    params = urllib.parse.urlencode({
        "latitude": latitude, "longitude": longitude, "forecast_days": min(max(days, 1), 16), "timezone": "auto",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,wind_speed_10m_max",
    })
    req = urllib.request.Request(f"https://api.open-meteo.com/v1/forecast?{params}", headers={"User-Agent": "AgriSmart/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:  # noqa: S310
        return json.loads(r.read())["daily"]


def search_knowledge(query: str, k: int = 3) -> list[dict]:
    """Hybrid (BM25 + dense) search over the agronomy knowledge base."""
    from AIML.rag.pipeline import Retriever, chunk_by_heading, load_docs

    retriever = _retriever(Retriever, chunk_by_heading, load_docs)
    return [{"source": c.source, "title": c.title, "text": c.text} for c in retriever.search(query, k=k, rerank=True)]


_RETRIEVER = None


def _retriever(cls, chunker, loader):
    global _RETRIEVER
    if _RETRIEVER is None:
        _RETRIEVER = cls(chunker(loader()))
    return _RETRIEVER
