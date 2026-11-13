"""Crop recommendation.

Uses the trained model at ml/models/crop_model.joblib when it exists
(produced by ml/train.py). Otherwise falls back to similarity against the
reference crop profiles, so the API works before any model is trained.
"""
import math
from functools import lru_cache
from pathlib import Path

from app.data.crops import CROPS, FEATURES
from app.schemas import CropRecommendation, CropScore, SoilConditions

MODEL_PATH = Path(__file__).resolve().parents[3] / "ml" / "models" / "crop_model.joblib"

# Typical spread of each feature; used to put features on a comparable scale.
FEATURE_SCALE = {
    "N": 35.0,
    "P": 30.0,
    "K": 45.0,
    "temperature": 4.0,
    "humidity": 15.0,
    "ph": 0.6,
    "rainfall": 50.0,
}


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.exists():
        return None
    import joblib  # imported lazily: only needed when a model exists

    return joblib.load(MODEL_PATH)


def _score(crop_name: str, confidence: float) -> CropScore:
    profile = CROPS.get(crop_name)
    return CropScore(
        crop=crop_name,
        confidence=round(confidence, 4),
        season=profile.season if profile else "unknown",
        category=profile.category if profile else "unknown",
    )


def _recommend_with_model(model, soil: SoilConditions, k: int) -> CropRecommendation:
    import pandas as pd

    row = pd.DataFrame([[getattr(soil, f) for f in FEATURES]], columns=list(FEATURES))
    probs = model.predict_proba(row)[0]
    ranked = sorted(zip(model.classes_, probs), key=lambda p: p[1], reverse=True)[:k]
    return CropRecommendation(
        method="ml-model", top=[_score(str(c), float(p)) for c, p in ranked]
    )


def _recommend_by_similarity(soil: SoilConditions, k: int) -> CropRecommendation:
    """Score = how closely the readings match each crop's profile (0-1).

    Each feature's deviation is measured in units of FEATURE_SCALE; the score
    is exp(-mean squared deviation / 2). An exact match scores 1.0, and being
    one typical spread off on every feature scores ~0.61. Scores are absolute,
    not shares, so several crops can match well at the same time.
    """
    scores: dict[str, float] = {}
    for name, profile in CROPS.items():
        mean_sq = sum(
            ((getattr(soil, f) - getattr(profile, f)) / FEATURE_SCALE[f]) ** 2
            for f in FEATURES
        ) / len(FEATURES)
        scores[name] = math.exp(-mean_sq / 2)

    ranked = sorted(scores.items(), key=lambda p: p[1], reverse=True)[:k]
    return CropRecommendation(
        method="profile-similarity",
        top=[_score(name, s) for name, s in ranked],
    )


def recommend_crops(soil: SoilConditions, k: int = 3) -> CropRecommendation:
    model = _load_model()
    if model is not None:
        return _recommend_with_model(model, soil, k)
    return _recommend_by_similarity(soil, k)
