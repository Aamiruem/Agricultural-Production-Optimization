"""Yield prediction (regression) on real Indian crop-yield data, tracked in MLflow.

Models: Linear, Ridge, Lasso, ElasticNet, Polynomial+Ridge, Random Forest,
Gradient Boosting, XGBoost — all predicting log(1 + yield) so errors are
relative, inside one scikit-learn Pipeline (one-hot crop/season/state +
scaled numerics). Time-based split: train 1997-2014, test 2015-2020.

The best model (by test RMSE in log space) is saved with historical yield
percentiles as `AIML/models/yield_model.joblib`, served by FastAPI
`POST /api/yield/predict`.

    python -m AIML.machine_learning.yield_regression
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone

import joblib
import mlflow
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, PolynomialFeatures, StandardScaler
from xgboost import XGBRegressor

from AIML.config import (
    MLFLOW_ARTIFACT_ROOT,
    MLFLOW_TRACKING_URI,
    MODELS_DIR,
    RANDOM_STATE,
    YIELD_EXPERIMENT_NAME,
    YIELD_METRICS_PATH,
    YIELD_MODEL_PATH,
)
from AIML.preprocessing.yield_features import CATEGORICAL, NUMERIC, TARGET, history_table, load_yield, time_split


def preprocessor(poly: bool = False) -> ColumnTransformer:
    numeric_steps = [("scale", StandardScaler())]
    if poly:
        numeric_steps.insert(0, ("poly", PolynomialFeatures(degree=2, include_bias=False)))
    return ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore", min_frequency=5), CATEGORICAL),
            ("num", Pipeline(numeric_steps), NUMERIC),
        ]
    )


def candidates() -> dict:
    return {
        "linear": (LinearRegression(), False),
        "ridge": (Ridge(alpha=1.0), False),
        "lasso": (Lasso(alpha=0.001, max_iter=5000), False),
        "elastic_net": (ElasticNet(alpha=0.001, l1_ratio=0.5, max_iter=5000), False),
        "polynomial_ridge": (Ridge(alpha=3.0), True),
        "random_forest": (
            RandomForestRegressor(n_estimators=300, min_samples_leaf=2, n_jobs=-1, random_state=RANDOM_STATE),
            False,
        ),
        "gradient_boosting": (
            GradientBoostingRegressor(n_estimators=400, max_depth=4, learning_rate=0.05, random_state=RANDOM_STATE),
            False,
        ),
        "xgboost": (
            XGBRegressor(
                n_estimators=600,
                max_depth=7,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.8,
                random_state=RANDOM_STATE,
                n_jobs=-1,
            ),
            False,
        ),
    }


def build(regressor, poly: bool) -> TransformedTargetRegressor:
    return TransformedTargetRegressor(
        regressor=Pipeline([("prep", preprocessor(poly)), ("model", regressor)]),
        func=np.log1p,
        inverse_func=np.expm1,
    )


def evaluate(model, X: pd.DataFrame, y: pd.Series) -> dict[str, float]:
    pred = np.clip(model.predict(X), 0, None)
    return {
        "rmse_log": float(np.sqrt(mean_squared_error(np.log1p(y), np.log1p(pred)))),
        "mae_t_ha": float(mean_absolute_error(y, pred)),
        "r2_log": float(r2_score(np.log1p(y), np.log1p(pred))),
        "median_ape": float(np.median(np.abs(pred - y) / y)),  # typical relative error
    }


def main(only: list[str] | None = None) -> dict:
    df = load_yield()
    train, test = time_split(df)
    X_tr, y_tr, X_te, y_te = train[CATEGORICAL + NUMERIC], train[TARGET], test[CATEGORICAL + NUMERIC], test[TARGET]

    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    if mlflow.get_experiment_by_name(YIELD_EXPERIMENT_NAME) is None:
        mlflow.create_experiment(YIELD_EXPERIMENT_NAME, artifact_location=MLFLOW_ARTIFACT_ROOT)
    mlflow.set_experiment(YIELD_EXPERIMENT_NAME)

    leaderboard, fitted = {}, {}
    with mlflow.start_run(run_name=f"yield-{datetime.now():%Y%m%d-%H%M%S}"):
        mlflow.log_params(
            {"train_rows": len(train), "test_rows": len(test), "test_from_year": int(test["Crop_Year"].min())}
        )
        for name, (reg, poly) in candidates().items():
            if only and name not in only:
                continue
            with mlflow.start_run(run_name=name, nested=True):
                model = build(reg, poly).fit(X_tr, y_tr)
                leaderboard[name] = evaluate(model, X_te, y_te)
                fitted[name] = model
                mlflow.log_param("model", name)
                mlflow.log_metrics(leaderboard[name])
            print(f"{name:18s} " + " ".join(f"{k}={v:.3f}" for k, v in leaderboard[name].items()))

        best = min(leaderboard, key=lambda n: leaderboard[n]["rmse_log"])
        mlflow.set_tag("best_model", best)
        # Refit the winner on all years before saving for serving.
        final = build(*candidates()[best]).fit(df[CATEGORICAL + NUMERIC], df[TARGET])

    recent = df[df["Crop_Year"] >= df["Crop_Year"].max() - 3]
    bundle = {
        "model": final,
        "name": best,
        "features": CATEGORICAL + NUMERIC,
        "options": {c: sorted(df[c].unique().tolist()) for c in CATEGORICAL},
        "defaults": {
            "rainfall_by_state": df.groupby("State")["Annual_Rainfall"].median().round(1).to_dict(),
            "fertilizer_kg_ha": round(float(recent["fertilizer_kg_ha"].median()), 2),
            "pesticide_kg_ha": round(float(recent["pesticide_kg_ha"].median()), 3),
        },
        "history": history_table(df),
        "metrics": leaderboard[best],
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, YIELD_MODEL_PATH, compress=3)
    report = {
        "best_model": best,
        "leaderboard": leaderboard,
        "trained_at": bundle["trained_at"],
        "rows": len(df),
        "split": f"train < {int(test['Crop_Year'].min())} <= test",
    }
    YIELD_METRICS_PATH.write_text(json.dumps(report, indent=2))
    print(f"\nBest: {best} -> {YIELD_MODEL_PATH}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*", help="train only these candidates")
    main(parser.parse_args().only)
