"""Explain the trained model's global feature importance.

    python -m ml.explain        # after `python -m ml.train`

Uses SHAP (mean |SHAP value| per feature). If SHAP can't be loaded, falls
back to scikit-learn permutation importance (drop in macro-F1 when a
feature is shuffled). Writes ml/reports/feature_importance.{json,png}.
"""
import json

import joblib
import matplotlib

matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from sklearn.inspection import permutation_importance  # noqa: E402

from ml.config import FEATURES, MODEL_BUNDLE_PATH, RANDOM_STATE, REPORTS_DIR  # noqa: E402
from ml.preprocessing.features import load_dataset, split_dataset  # noqa: E402


def shap_importance(pipeline, X) -> dict[str, float]:
    import shap

    clf = pipeline.named_steps["clf"]
    if "scale" in pipeline.named_steps:  # linear model: explain in scaled space
        X_in = pipeline.named_steps["scale"].transform(X)
        explainer = shap.LinearExplainer(clf, X_in)
    else:
        X_in = X
        explainer = shap.TreeExplainer(clf)
    values = np.asarray(explainer.shap_values(X_in))
    # Multi-class output: average |SHAP| over samples and classes, per feature.
    feature_axis = values.shape.index(len(FEATURES))
    other_axes = tuple(i for i in range(values.ndim) if i != feature_axis)
    return dict(zip(FEATURES, map(float, np.abs(values).mean(axis=other_axes))))


def permutation(pipeline, X, y) -> dict[str, float]:
    res = permutation_importance(pipeline, X, y, scoring="f1_macro", n_repeats=10, random_state=RANDOM_STATE)
    return dict(zip(FEATURES, map(float, res.importances_mean)))


def main(sample: int = 300) -> dict:
    bundle = joblib.load(MODEL_BUNDLE_PATH)
    pipeline = bundle["model"]
    split = split_dataset(load_dataset())
    X = split.X_test.sample(min(sample, len(split.X_test)), random_state=0)
    y = split.y_test[split.X_test.index.get_indexer(X.index)]

    try:
        method, scores = "mean |SHAP value|", shap_importance(pipeline, X)
    except (ImportError, OSError) as exc:
        print(f"SHAP unavailable ({exc.__class__.__name__}); using permutation importance")
        method, scores = "permutation importance (Δ macro-F1)", permutation(pipeline, X, y)
    result = dict(sorted(scores.items(), key=lambda kv: -kv[1]))

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "feature_importance.json").write_text(
        json.dumps({"model": bundle["name"], "method": method, "importance": result}, indent=2))
    fig, ax = plt.subplots(figsize=(6, 3.5))
    ax.barh(list(result)[::-1], list(result.values())[::-1], color="#2e7d32")
    ax.set_xlabel(method)
    ax.set_title(f"Feature importance ({bundle['name']})")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "feature_importance.png", dpi=120)
    print(method)
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    main()
