"""Gradient-boosting showdown on yield prediction: XGBoost vs LightGBM vs CatBoost.

Each library's *native* categorical handling is used (no one-hot), with early
stopping on a validation split carved from the training years.

    python -m AIML.advanced_ml.boosting
"""
from __future__ import annotations

import json
import time

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor, early_stopping, log_evaluation
from sklearn.metrics import mean_squared_error, r2_score
from xgboost import XGBRegressor

from AIML.config import RANDOM_STATE, REPORTS_DIR
from AIML.preprocessing.yield_features import CATEGORICAL, NUMERIC, TARGET, load_yield, time_split


def _xy(df: pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
    X = df[CATEGORICAL + NUMERIC].copy()
    for c in CATEGORICAL:
        X[c] = X[c].astype("category")
    return X, np.log1p(df[TARGET].to_numpy())


def _align_categories(*frames: pd.DataFrame) -> None:
    for c in CATEGORICAL:
        cats = sorted(set().union(*(f[c].astype(str).unique() for f in frames)))
        for f in frames:
            f[c] = pd.Categorical(f[c].astype(str), categories=cats)


def main() -> dict:
    df = load_yield()
    train, test = time_split(df)
    fit, val = train[train["Crop_Year"] < 2012], train[train["Crop_Year"] >= 2012]
    (X_fit, y_fit), (X_val, y_val), (X_te, y_te) = _xy(fit), _xy(val), _xy(test)
    _align_categories(X_fit, X_val, X_te)

    models = {
        "xgboost": XGBRegressor(n_estimators=2000, learning_rate=0.03, max_depth=7, subsample=0.9, colsample_bytree=0.8,
                                enable_categorical=True, tree_method="hist", early_stopping_rounds=100,
                                random_state=RANDOM_STATE, n_jobs=-1),
        "lightgbm": LGBMRegressor(n_estimators=2000, learning_rate=0.03, num_leaves=63, subsample=0.9, subsample_freq=1,
                                  colsample_bytree=0.8, random_state=RANDOM_STATE, verbose=-1),
        "catboost": CatBoostRegressor(iterations=800, learning_rate=0.08, depth=6, random_seed=RANDOM_STATE,
                                      cat_features=CATEGORICAL, verbose=0, early_stopping_rounds=100),
    }
    results = {}
    for name, model in models.items():
        start = time.perf_counter()
        if name == "xgboost":
            model.fit(X_fit, y_fit, eval_set=[(X_val, y_val)], verbose=False)
        elif name == "lightgbm":
            model.fit(X_fit, y_fit, eval_set=[(X_val, y_val)], callbacks=[early_stopping(100, verbose=False), log_evaluation(0)])
        else:  # CatBoost wants string categories
            model.fit(X_fit.astype({c: str for c in CATEGORICAL}), y_fit,
                      eval_set=(X_val.astype({c: str for c in CATEGORICAL}), y_val))
        X_eval = X_te.astype({c: str for c in CATEGORICAL}) if name == "catboost" else X_te
        pred = model.predict(X_eval)
        results[name] = {
            "rmse_log": float(np.sqrt(mean_squared_error(y_te, pred))),
            "r2_log": float(r2_score(y_te, pred)),
            "median_ape": float(np.median(np.abs(np.expm1(pred) - np.expm1(y_te)) / np.expm1(y_te))),
            "fit_seconds": round(time.perf_counter() - start, 1),
        }
        print(f"{name:9s} " + " ".join(f"{k}={v:.3f}" for k, v in results[name].items()))

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "boosting_comparison.json").write_text(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    main()
