"""Farmer-query intent classification: TF-IDF features + linear models.

Compares Logistic Regression, Linear SVM and Multinomial Naive Bayes with
stratified 5-fold cross-validation, then saves the best as a pipeline
(AIML/models/intent_model.joblib). The multi-agent supervisor
(AIML/agentic_ai/multi_agent.py) uses it to route a farmer's question to the
right tool: pest doctor, fertilizer calculator, weather, ...

    python -m AIML.nlp.intent_classifier
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report, f1_score
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC

from AIML.config import INTENT_MODEL_PATH, MODELS_DIR, RANDOM_STATE

DATA = Path(__file__).parent / "data" / "farmer_queries.csv"


def features() -> FeatureUnion:
    # Word-level (stemmed, Hinglish-normalised) + character n-grams (robust to spelling variants).
    from AIML.nlp.preprocess import analyzer

    return FeatureUnion(
        [
            ("words", TfidfVectorizer(analyzer=analyzer, sublinear_tf=True)),
            ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True, min_df=2)),
        ]
    )


def candidates() -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline([("tfidf", features()), ("clf", LogisticRegression(C=10, max_iter=2000))]),
        "linear_svm": Pipeline([("tfidf", features()), ("clf", CalibratedClassifierCV(LinearSVC(C=1.0), cv=3))]),
        "naive_bayes": Pipeline([("tfidf", features()), ("clf", MultinomialNB(alpha=0.1))]),
    }


def main() -> dict:
    df = pd.read_csv(DATA)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    results = {}
    for name, pipe in candidates().items():
        pred = cross_val_predict(pipe, df["text"], df["intent"], cv=cv)
        results[name] = {
            "macro_f1": float(f1_score(df["intent"], pred, average="macro")),
            "accuracy": float(np.mean(pred == df["intent"])),
        }
        print(f"{name:20s} macro-F1={results[name]['macro_f1']:.3f}")
    best = max(results, key=lambda n: results[n]["macro_f1"])
    model = candidates()[best].fit(df["text"], df["intent"])
    report = classification_report(
        df["intent"],
        cross_val_predict(candidates()[best], df["text"], df["intent"], cv=cv),
        output_dict=True,
        zero_division=0,
    )
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"model": model, "name": best, "labels": sorted(df["intent"].unique()), "cv": results[best]}, INTENT_MODEL_PATH
    )
    return {
        "best": best,
        "results": results,
        "per_class_f1": {
            k: round(v["f1-score"], 3) for k, v in report.items() if isinstance(v, dict) and k in set(df["intent"])
        },
    }


def predict(texts: list[str], bundle: dict | None = None) -> list[dict]:
    bundle = bundle or joblib.load(INTENT_MODEL_PATH)
    probs = bundle["model"].predict_proba(texts)
    classes = bundle["model"].classes_
    return [{"intent": classes[i], "confidence": round(float(p[i]), 3)} for p, i in zip(probs, probs.argmax(1))]


if __name__ == "__main__":
    print(json.dumps(main(), indent=2))
    print(predict(["Caterpillars eating my cabbage", "kitna DAP daalna hai makka mein", "Is rain expected tomorrow?"]))
