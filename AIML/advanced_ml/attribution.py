"""Per-prediction explanations for the crop recommender, used in live serving.

``explain_crop(bundle, soil)`` returns, for each of the top-ranked crops, how much
each soil/climate reading pushed that crop's probability up or down.

* Tree models (Random Forest, XGBoost, LightGBM …) use exact **TreeSHAP**
  (``shap.TreeExplainer``) — about 10 ms per request on the 300-tree forest.
* Anything else, or a host where SHAP cannot load, uses **occlusion**: the drop
  in probability when one feature is replaced by its dataset mean.

Unlike ``AIML.advanced_ml.explain`` (global importance + plots, offline), this
module has no plotting dependency and imports SHAP lazily, so it is safe to call
from a web request.
"""
from __future__ import annotations

import threading
from functools import lru_cache

import numpy as np
import pandas as pd

from AIML.config import DATA_PATH, FEATURES

_lock = threading.Lock()
_explainers: dict[int, object] = {}  # id(estimator) -> shap.TreeExplainer


def _class_names(bundle: dict) -> list[str]:
    model = bundle["model"]
    model_classes = getattr(model, "classes_", range(len(bundle["classes"])))
    if bundle.get("encoded", True):
        return [bundle["classes"][int(i)] for i in model_classes]
    return [str(c) for c in model_classes]


@lru_cache(maxsize=1)
def _feature_means() -> dict[str, float]:
    """Baseline for occlusion: mean of each feature in the training data."""
    if DATA_PATH.exists():
        frame = pd.read_csv(DATA_PATH)
        return {f: float(frame[f].mean()) for f in FEATURES if f in frame}
    return {"N": 50.6, "P": 53.4, "K": 48.1, "temperature": 25.6, "humidity": 71.5, "ph": 6.47, "rainfall": 103.5}


def _final_estimator(model):
    steps = getattr(model, "named_steps", None)
    if steps is None:
        return model, None
    est = steps.get("clf") or list(steps.values())[-1]
    pre = model[:-1] if len(steps) > 1 else None
    return est, pre


def _tree_explainer(estimator):
    key = id(estimator)
    with _lock:
        if key not in _explainers:
            import shap  # lazy: ~3 s import, only paid once per process

            if len(_explainers) >= 4:  # bundles are reloaded rarely; keep the cache bounded
                _explainers.clear()
            _explainers[key] = shap.TreeExplainer(estimator)
        return _explainers[key]


def _shap_matrix(model, row: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """SHAP values as (n_features, n_classes) plus the per-class base value."""
    estimator, pre = _final_estimator(model)
    if not hasattr(estimator, "estimators_") and not hasattr(estimator, "get_booster") and not hasattr(estimator, "booster_"):
        raise TypeError("not a tree model")
    x = pre.transform(row) if pre is not None else row
    explainer = _tree_explainer(estimator)
    values = explainer.shap_values(x)
    if isinstance(values, list):  # older SHAP: one (n, F) array per class
        values = np.stack(values, axis=-1)
    values = np.asarray(values)[0]
    if values.ndim == 1:  # single-output model
        values = values[:, None]
    base = np.atleast_1d(np.asarray(explainer.expected_value, dtype=float))
    return values, base


def _occlusion_matrix(model, row: pd.DataFrame, probs: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    means = _feature_means()
    perturbed = pd.concat([row] * len(row.columns), ignore_index=True)
    for i, col in enumerate(row.columns):
        perturbed.loc[i, col] = means.get(col, float(row[col].iloc[0]))
    occluded = model.predict_proba(perturbed)  # (F, C)
    base = model.predict_proba(pd.DataFrame([means])[list(row.columns)])[0]
    return probs[None, :] - occluded, base


def explain_crop(bundle: dict, soil: dict, top: int = 3) -> dict:
    """Explain the model's top-``top`` crops for one soil/climate reading."""
    features = bundle.get("features", FEATURES)
    row = pd.DataFrame([[float(soil[f]) for f in features]], columns=features)
    model = bundle["model"]
    probs = model.predict_proba(row)[0]
    names = _class_names(bundle)

    try:
        matrix, base = _shap_matrix(model, row)
        method = "TreeSHAP"
    except Exception:  # SHAP missing/blocked, or a non-tree model
        matrix, base = _occlusion_matrix(model, row, probs)
        method = "occlusion (feature → dataset mean)"

    order = np.argsort(-probs)[: max(1, min(top, len(names)))]
    explanations = []
    for ci in order:
        contribs = [
            {"feature": f, "value": round(float(row[f].iloc[0]), 3), "contribution": round(float(matrix[fi, ci]), 5)}
            for fi, f in enumerate(features)
        ]
        contribs.sort(key=lambda c: -abs(c["contribution"]))
        explanations.append({
            "crop": names[ci],
            "probability": round(float(probs[ci]), 4),
            "base_value": round(float(base[ci] if ci < len(base) else base[0]), 5),
            "contributions": contribs,
        })
    return {"method": method, "model": bundle.get("name", type(model).__name__), "explanations": explanations}
