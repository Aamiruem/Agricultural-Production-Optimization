"""Built-in AgriSmart datasets: schema detection, canonical rows and state statistics."""

from __future__ import annotations

import csv
import io
import re
from functools import lru_cache
from pathlib import Path
from statistics import median
from typing import Any

from .matching import norm_place, norm_season

DATASET_DIR = Path(__file__).resolve().parents[5] / "AIML" / "datasets"

BUILTIN = {
    "crop_yield": {
        "file": "crop_yield.csv",
        "label": "crop_yield.csv — state crop statistics 1997–2020",
        "resolution": "state",
        "notComparable": {"area": "Dataset area is the total crop area of the state, not a farm area."},
    },
    "crop_data": {
        "file": "crop_data.csv",
        "label": "crop_data.csv — crop requirement profiles (no location)",
        "resolution": "none",
    },
}

CANONICAL = {
    "state": (["state", "statename", "stname", "province"], "text", None),
    "district": (["district", "districtname", "dist", "dtname"], "text", None),
    "subdistrict": (["tehsil", "taluka", "taluk", "subdistrict", "mandal", "block"], "text", None),
    "village": (["village", "villagename", "locality", "colony", "town"], "text", None),
    "lat": (["lat", "latitude", "y"], "number", (6, 38)),
    "lon": (["lon", "lng", "long", "longitude", "x"], "number", (67, 98)),
    "area": (["area", "areaha", "landarea", "farmarea", "cultivatedarea", "hectares"], "number", (0, 1e9)),
    "soil_type": (["soiltype", "soil", "soilclass"], "text", None),
    "ph": (["ph", "soilph"], "number", (2, 11)),
    "N": (["n", "nitrogen", "availablen"], "number", (0, 2000)),
    "P": (["p", "phosphorus", "availablep"], "number", (0, 500)),
    "K": (["k", "potassium", "availablek"], "number", (0, 2000)),
    "oc": (["oc", "organiccarbon", "soc"], "number", (0, 20)),
    "rainfall": (["rainfall", "annualrainfall", "rain", "precipitation"], "number", (0, 15000)),
    "temperature": (["temperature", "temp", "meantemperature", "avgtemp"], "number", (-20, 55)),
    "humidity": (["humidity", "relativehumidity", "rh"], "number", (0, 100)),
    "season": (["season", "cropseason"], "text", None),
    "crop": (["crop", "croptype", "cropname", "label", "commodity"], "text", None),
    "irrigation": (["irrigation", "irrigated", "irrigationtype"], "text", None),
    "production": (["production", "totalproduction", "output"], "number", (0, 1e12)),
    "yield": (["yield", "yieldtha", "productivity"], "number", (0, 1e6)),
    "year": (["year", "cropyear"], "number", (1900, 2100)),
    "fertilizer": (["fertilizer", "fertiliser", "fertilizerusage", "fertilizerkg"], "number", (0, 1e12)),
    "pesticide": (["pesticide", "pesticideusage"], "number", (0, 1e12)),
}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _num(v: Any) -> float | None:
    try:
        return float(str(v).replace(",", ""))
    except (TypeError, ValueError):
        return None


def detect_schema(headers: list[str], rows: list[dict]) -> dict:
    sample = rows[:200]
    fields = []
    for h in headers:
        hn = _norm(h)
        values = [r.get(h) for r in sample if r.get(h) not in (None, "")]
        nums = [x for x in (_num(v) for v in values) if x is not None]
        share = len(nums) / len(values) if values else 0
        best = None
        for canon, (syn, kind, rng) in CANONICAL.items():
            exact = hn in syn
            partial = not exact and any(len(s) > 2 and (hn.startswith(s) or hn.endswith(s)) for s in syn)
            if not (exact or partial):
                continue
            conf = 0.9 if exact else 0.6
            if kind == "number":
                if share < 0.9:
                    continue
                in_range = sum(1 for x in nums if rng[0] <= x <= rng[1]) / (len(nums) or 1)
                conf *= 1 if in_range >= 0.95 else 0.5
            elif share > 0.9:
                conf *= 0.4
            if not best or conf > best[1]:
                best = (canon, round(conf, 2))
        fields.append(
            {
                "header": h,
                "canonical": best[0] if best else None,
                "confidence": best[1] if best else 0,
                "numericShare": round(share, 2),
            }
        )
    mapping: dict[str, str] = {}
    for f in sorted(fields, key=lambda f: -f["confidence"]):
        if f["canonical"] and f["canonical"] not in mapping:
            mapping[f["canonical"]] = f["header"]
        elif f["canonical"]:
            f["canonical"] = None
    return {
        "mapping": mapping,
        "fields": fields,
        "unmapped": [f["header"] for f in fields if not f["canonical"]],
        "hasLocation": any(k in mapping for k in ("state", "district", "village"))
        or ("lat" in mapping and "lon" in mapping),
        "hasCoordinates": "lat" in mapping and "lon" in mapping,
    }


def canonical_rows(rows: list[dict], mapping: dict[str, str]) -> list[dict]:
    out = []
    for r in rows:
        c = {}
        for canon, header in mapping.items():
            raw = r.get(header)
            if raw in (None, ""):
                c[canon] = None
            elif CANONICAL[canon][1] == "number":
                c[canon] = _num(raw)
            else:
                c[canon] = str(raw).strip()
        out.append(c)
    return out


def parse_csv(text: str) -> tuple[list[str], list[dict]]:
    reader = csv.DictReader(io.StringIO(text.strip()))
    headers = [h.strip() for h in reader.fieldnames or []]
    rows = [{(k or "").strip(): v for k, v in r.items()} for r in reader]
    return headers, rows


@lru_cache(maxsize=4)
def load_builtin(dataset_id: str) -> dict:
    meta = BUILTIN[dataset_id]
    headers, rows = parse_csv((DATASET_DIR / meta["file"]).read_text(encoding="utf-8"))
    schema = detect_schema(headers, rows)
    return {"id": dataset_id, "meta": meta, "schema": schema, "rows": canonical_rows(rows, schema["mapping"])}


def records_for(rows: list[dict], state: str | None, district: str | None = None) -> tuple[list[dict], str | None]:
    st = norm_place(state)
    in_state = [r for r in rows if r.get("state") and norm_place(r["state"]) == st]
    if district:
        ds = norm_place(district)
        in_district = [r for r in in_state if r.get("district") and norm_place(r["district"]) == ds]
        if in_district:
            return in_district, "district"
    return in_state, ("state" if in_state else None)


def state_agriculture(rows: list[dict]) -> dict | None:
    if not rows:
        return None
    years = [r["year"] for r in rows if r.get("year")]
    latest = int(max(years))
    recent = [r for r in rows if (r.get("year") or 0) >= latest - 4]
    n_years = len({r["year"] for r in recent}) or 1
    crops: dict = {}
    for r in recent:
        e = crops.setdefault(r["crop"], {"area": 0.0, "yields": [], "seasons": set()})
        e["area"] += r.get("area") or 0
        if r.get("yield") is not None:
            e["yields"].append(r["yield"])
        if norm_season(r.get("season")):
            e["seasons"].add(norm_season(r["season"]))
    return {
        "firstYear": int(min(years)),
        "latestYear": latest,
        "records": len(rows),
        "crops": sorted(
            (
                {
                    "crop": c,
                    "avgAreaHa": round(e["area"] / n_years),
                    "medianYield": round(median(e["yields"]), 2) if e["yields"] else None,
                    "seasons": sorted(e["seasons"]),
                }
                for c, e in crops.items()
            ),
            key=lambda x: -x["avgAreaHa"],
        ),
        "source": "AIML/datasets/crop_yield.csv",
        "resolution": "state",
    }
