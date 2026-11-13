"""Imbalanced learning: predict low-yield *risk* (a rare, important outcome).

Label: a crop-state-season record is "low yield" when its yield falls below the
10th percentile of that crop's history (≈10% positives). We compare
  baseline · class weights · random undersampling · SMOTE (on the training fold only)
with metrics that stay honest under imbalance: PR-AUC, recall, F1 — not accuracy.

    python -m AIML.advanced_ml.imbalanced
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.under_sampling import RandomUnderSampler
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, recall_score, roc_auc_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from AIML.config import RANDOM_STATE, REPORTS_DIR
from AIML.preprocessing.yield_features import CATEGORICAL, NUMERIC, load_yield, time_split


def label_low_yield(df: pd.DataFrame, q: float = 0.10) -> pd.Series:
    threshold = df.groupby("Crop")["Yield"].transform(lambda s: s.quantile(q))
    return (df["Yield"] < threshold).astype(int)


def make(strategy: str) -> ImbPipeline:
    prep = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore", min_frequency=5, sparse_output=False), CATEGORICAL),
        ("num", StandardScaler(), NUMERIC),
    ])
    steps = [("prep", prep)]
    if strategy == "smote":
        steps.append(("resample", SMOTE(random_state=RANDOM_STATE)))
    elif strategy == "undersample":
        steps.append(("resample", RandomUnderSampler(random_state=RANDOM_STATE)))
    weight = "balanced" if strategy == "class_weight" else None
    steps.append(("clf", LogisticRegression(max_iter=3000, class_weight=weight)))
    return ImbPipeline(steps)  # resampling happens inside fit only — never on test data


def main() -> dict:
    df = load_yield()
    df["low_yield"] = label_low_yield(df)
    train, test = time_split(df)
    X_tr, y_tr, X_te, y_te = train[CATEGORICAL + NUMERIC], train["low_yield"], test[CATEGORICAL + NUMERIC], test["low_yield"]

    results = {"positive_rate_train": float(y_tr.mean()), "positive_rate_test": float(y_te.mean())}
    for strategy in ("baseline", "class_weight", "undersample", "smote"):
        model = make(strategy).fit(X_tr, y_tr)
        proba = model.predict_proba(X_te)[:, 1]
        pred = (proba >= 0.5).astype(int)
        results[strategy] = {
            "pr_auc": float(average_precision_score(y_te, proba)),
            "roc_auc": float(roc_auc_score(y_te, proba)),
            "recall": float(recall_score(y_te, pred)),
            "f1": float(f1_score(y_te, pred)),
            "accuracy": float((pred == y_te).mean()),
        }
        print(f"{strategy:12s} " + " ".join(f"{k}={v:.3f}" for k, v in results[strategy].items()))
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "imbalanced.json").write_text(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    np.random.seed(RANDOM_STATE)
    main()
