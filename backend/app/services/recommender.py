"""Crop recommendation.

Serves the model bundle written by `python -m ml.train` (best of Logistic
Regression / Random Forest / XGBoost). Until a model exists, falls back to
similarity against the reference crop profiles so the API always works.
"""
import json
import math
import threading
from pathlib import Path

from app.core.config import get_settings
from app.data.crops import CROPS, FEATURES
from app.schemas import CropRecommendation, CropScore, SoilConditions

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

_lock = threading.Lock()
_cache: dict = {"loaded": False, "bundle": None}


def _load_bundle(path: Path):
    if not path.exists():
        return None
    import joblib  # lazy: only needed when a trained model exists

    obj = joblib.load(path)
    if isinstance(obj, dict) and "model" in obj:
        return obj
    # Legacy: a bare estimator saved by an older train.py
    return {"model": obj, "classes": [str(c) for c in obj.classes_], "features": list(FEATURES),
            "name": type(obj).__name__, "metrics": {}, "trained_at": None, "encoded": False}


def get_bundle():
    with _lock:
        if not _cache["loaded"]:
            _cache["bundle"] = _load_bundle(get_settings().model_path)
            _cache["loaded"] = True
        return _cache["bundle"]


def reload_model() -> dict:
    with _lock:
        _cache["loaded"] = False
    return model_info()


def model_info() -> dict:
    bundle = get_bundle()
    if bundle is None:
        return {"method": "profile-similarity", "model": None, "trained_at": None, "metrics": {}}
    return {
        "method": "ml-model",
        "model": bundle["name"],
        "trained_at": bundle.get("trained_at"),
        "metrics": bundle.get("metrics", {}),
    }


def training_report() -> dict | None:
    path = get_settings().metrics_path
    return json.loads(path.read_text()) if path.exists() else None


def _score(crop_name: str, confidence: float) -> CropScore:
    profile = CROPS.get(crop_name)
    return CropScore(
        crop=crop_name,
        confidence=round(min(max(confidence, 0.0), 1.0), 4),
        season=profile.season if profile else "unknown",
        category=profile.category if profile else "unknown",
    )


def _recommend_with_model(bundle: dict, soils: list[SoilConditions], k: int) -> list[CropRecommendation]:
    import pandas as pd

    features = bundle.get("features", list(FEATURES))
    frame = pd.DataFrame([[getattr(s, f) for f in features] for s in soils], columns=features)
    probs = bundle["model"].predict_proba(frame)
    model_classes = getattr(bundle["model"], "classes_", range(len(bundle["classes"])))
    if bundle.get("encoded", True):  # integer-encoded labels -> names
        names = [bundle["classes"][int(i)] for i in model_classes]
    else:
        names = [str(c) for c in model_classes]
    results = []
    for row in probs:
        ranked = sorted(zip(names, row), key=lambda p: p[1], reverse=True)[:k]
        results.append(CropRecommendation(method="ml-model", top=[_score(c, float(p)) for c, p in ranked]))
    return results


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


def recommend_many(soils: list[SoilConditions], k: int = 3) -> list[CropRecommendation]:
    bundle = get_bundle()
    if bundle is not None:
        return _recommend_with_model(bundle, soils, k)
    return [_recommend_by_similarity(s, k) for s in soils]


def recommend_crops(soil: SoilConditions, k: int = 3) -> CropRecommendation:
    return recommend_many([soil], k)[0]
