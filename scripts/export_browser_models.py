"""Export compact, browser-side models and analytics for the AgriSmart frontend.

The full XGBoost / RandomForest models are served by FastAPI. A static Vercel
deployment has no Python runtime, so this script fits small, transparent models
on the same datasets and writes them as JSON for the React app to use when the
API is unreachable:

* Yield model: log-yield = state/crop/season baseline + crop trend per year
  + crop rainfall elasticity. Evaluated on the same time split as the server
  model (train < 2015 <= test).
* Crop recommender: Gaussian Naive Bayes on N, P, K, temperature, humidity,
  pH, rainfall (22 crops), evaluated on a stratified 20% hold-out.
* Analytics: per-state yearly area/production, top crops and season shares.

Run from the repository root:  python scripts/export_browser_models.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "AIML" / "datasets"
OUT = ROOT / "frontend" / "react-app" / "src" / "data" / "generated"
RECENT_YEARS = 8


def load_yield() -> pd.DataFrame:
    df = pd.read_csv(DATA / "crop_yield.csv")
    for col in ("Crop", "Season", "State"):
        df[col] = df[col].astype(str).str.strip()
    df = df[(df.Area > 0) & (df.Production > 0) & (df.Annual_Rainfall > 0)].copy()
    df["yield"] = df.Production / df.Area
    df = df[df["yield"] > 0]
    df["log_y"] = np.log(df["yield"])
    df["log_rain"] = np.log(df.Annual_Rainfall)
    return df


def fit_yield(train: pd.DataFrame) -> dict:
    ref_year = int(train.Crop_Year.max())
    crops = {}
    for crop, g in train.groupby("Crop"):
        # Within-group (state+season) demeaning isolates the time trend and rainfall effect.
        key = g.State + "|" + g.Season
        y = g.log_y - g.groupby(key).log_y.transform("mean")
        t = g.Crop_Year - g.groupby(key).Crop_Year.transform("mean")
        r = g.log_rain - g.groupby(key).log_rain.transform("mean")
        x = np.column_stack([t, r])
        if len(g) >= 12 and np.linalg.matrix_rank(x) == 2:
            coef, *_ = np.linalg.lstsq(x, y, rcond=None)
            trend, rain = float(np.clip(coef[0], -0.05, 0.05)), float(np.clip(coef[1], -0.6, 0.6))
        else:
            trend, rain = 0.0, 0.0
        crops[crop] = {
            "trend": round(trend, 5),
            "rain": round(rain, 4),
            "base": round(
                float(
                    g[g.Crop_Year > ref_year - RECENT_YEARS].log_y.median()
                    if (g.Crop_Year > ref_year - RECENT_YEARS).any()
                    else g.log_y.median()
                ),
                4,
            ),
        }

    groups = {}
    for (state, crop, season), g in train.groupby(["State", "Crop", "Season"]):
        recent = g[g.Crop_Year > ref_year - RECENT_YEARS]
        src = recent if len(recent) >= 2 else g
        # Remove the trend so the baseline is anchored at ref_year.
        adj = src.log_y - crops[crop]["trend"] * (src.Crop_Year - ref_year)
        groups[f"{state}|{crop}|{season}"] = [
            round(float(adj.mean()), 4),
            round(float(src.log_rain.mean()), 4),
            int(len(g)),
            round(float(g["yield"].quantile(0.25)), 3),
            round(float(g["yield"].median()), 3),
            round(float(g["yield"].quantile(0.75)), 3),
        ]
    state_crop = {}
    for (state, crop), g in train.groupby(["State", "Crop"]):
        state_crop[f"{state}|{crop}"] = round(
            float((g.log_y - crops[crop]["trend"] * (g.Crop_Year - ref_year)).mean()), 4
        )
    state_rain = {s: round(float(g.log_rain.mean()), 4) for s, g in train.groupby("State")}
    return {"ref_year": ref_year, "crops": crops, "groups": groups, "state_crop": state_crop, "state_rain": state_rain}


def predict_yield(model: dict, state: str, crop: str, season: str, year: int, rain: float | None) -> float:
    c = model["crops"].get(crop)
    if c is None:
        return float("nan")
    grp = model["groups"].get(f"{state}|{crop}|{season}")
    if grp:
        base, mean_rain = grp[0], grp[1]
    else:
        base = model["state_crop"].get(f"{state}|{crop}", c["base"])
        mean_rain = model["state_rain"].get(state, 7.0)
    log_y = base + c["trend"] * (year - model["ref_year"])
    if rain:
        log_y += c["rain"] * (np.log(rain) - mean_rain)
    return float(np.exp(log_y))


def evaluate_yield(df: pd.DataFrame) -> dict:
    train, test = df[df.Crop_Year < 2015], df[df.Crop_Year >= 2015]
    model = fit_yield(train)
    pred = np.array(
        [predict_yield(model, r.State, r.Crop, r.Season, r.Crop_Year, r.Annual_Rainfall) for r in test.itertuples()]
    )
    ok = np.isfinite(pred)
    actual = test["yield"].to_numpy()[ok]
    pred = pred[ok]
    log_err = np.log(pred) - np.log(actual)
    ss_res = float(np.sum(log_err**2))
    ss_tot = float(np.sum((np.log(actual) - np.log(actual).mean()) ** 2))
    return {
        "r2_log": round(1 - ss_res / ss_tot, 4),
        "rmse_log": round(float(np.sqrt(np.mean(log_err**2))), 4),
        "median_ape": round(float(np.median(np.abs(pred - actual) / actual)), 4),
        "within_25pct": round(float(np.mean(np.abs(pred - actual) / actual <= 0.25)), 4),
        "test_rows": int(ok.sum()),
        "split": "train < 2015 <= test",
    }


def analytics(df: pd.DataFrame) -> dict:
    states = {}
    for state, g in df.groupby("State"):
        yearly = (
            g.groupby("Crop_Year")
            .agg(area=("Area", "sum"), production=("Production", "sum"), rain=("Annual_Rainfall", "mean"))
            .reset_index()
        )
        last = int(g.Crop_Year.max())
        recent = g[g.Crop_Year > last - 3]
        top = (
            recent.groupby("Crop")
            .agg(area=("Area", "sum"), production=("Production", "sum"))
            .assign(yield_=lambda x: x.production / x.area)
            .sort_values("area", ascending=False)
            .head(10)
        )
        seasons = recent.groupby("Season").Area.sum()
        states[state] = {
            "years": [
                [int(r.Crop_Year), round(float(r.area)), round(float(r.production)), round(float(r.rain))]
                for r in yearly.itertuples()
            ],
            "top": [
                [c, round(float(r.area) / 3), round(float(r.production) / 3), round(float(r.yield_), 3)]
                for c, r in top.iterrows()
            ],
            "seasons": {s: round(float(v / seasons.sum() * 100), 1) for s, v in seasons.items()},
            "crops": sorted(g.Crop.unique().tolist()),
            "seasonList": sorted(g.Season.unique().tolist()),
        }
    national = {}
    for crop, g in df.groupby("Crop"):
        y = g.groupby("Crop_Year").agg(area=("Area", "sum"), production=("Production", "sum"))
        national[crop] = [
            [int(yr), round(float(r.production / r.area), 3), round(float(r.area))] for yr, r in y.iterrows()
        ]
    return {
        "states": states,
        "national": national,
        "first_year": int(df.Crop_Year.min()),
        "last_year": int(df.Crop_Year.max()),
        "rows": int(len(df)),
    }


def recommender() -> tuple[dict, dict]:
    df = pd.read_csv(DATA / "crop_data.csv")
    feats = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    x_tr, x_te, y_tr, y_te = train_test_split(df[feats], df.label, test_size=0.2, stratify=df.label, random_state=42)
    acc = float(GaussianNB().fit(x_tr, y_tr).score(x_te, y_te))
    nb = GaussianNB().fit(df[feats], df.label)
    model = {
        "features": feats,
        "classes": nb.classes_.tolist(),
        "means": nb.theta_.round(4).tolist(),
        "vars": nb.var_.round(4).tolist(),
        "priors": nb.class_prior_.round(5).tolist(),
        "ranges": {f: [float(df[f].min()), float(df[f].max())] for f in feats},
    }
    return model, {"test_accuracy": round(acc, 4), "test_rows": int(len(y_te)), "model": "Gaussian Naive Bayes"}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    df = load_yield()
    metrics = {"yield": evaluate_yield(df)}
    yield_model = fit_yield(df)  # final model uses all years
    rec_model, metrics["recommend"] = recommender()
    server = json.loads((ROOT / "AIML" / "models" / "yield_metrics.json").read_text())
    metrics["server_yield"] = {"model": server["best_model"], **server["leaderboard"][server["best_model"]]}
    (OUT / "yieldModel.json").write_text(json.dumps(yield_model, separators=(",", ":")))
    (OUT / "recommendModel.json").write_text(json.dumps(rec_model, separators=(",", ":")))
    (OUT / "analytics.json").write_text(json.dumps(analytics(df), separators=(",", ":")))
    (OUT / "modelMetrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
