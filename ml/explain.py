"""Explain the trained model with SHAP (global feature importance).

    python -m ml.explain        # after `python -m ml.train`

Writes ml/reports/shap_importance.json and shap_importance.png.
"""
import json

import joblib
import matplotlib

matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import shap  # noqa: E402

from ml.config import FEATURES, MODEL_BUNDLE_PATH, REPORTS_DIR  # noqa: E402
from ml.preprocessing.features import load_dataset, split_dataset  # noqa: E402


def main(sample: int = 300) -> dict[str, float]:
    bundle = joblib.load(MODEL_BUNDLE_PATH)
    pipeline = bundle["model"]
    split = split_dataset(load_dataset())
    X = split.X_test.sample(min(sample, len(split.X_test)), random_state=0)

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
    importance = np.abs(values).mean(axis=other_axes)
    result = dict(sorted(zip(FEATURES, map(float, importance)), key=lambda kv: -kv[1]))

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "shap_importance.json").write_text(json.dumps(
        {"model": bundle["name"], "mean_abs_shap": result}, indent=2))
    fig, ax = plt.subplots(figsize=(6, 3.5))
    ax.barh(list(result)[::-1], list(result.values())[::-1], color="#2e7d32")
    ax.set_xlabel("mean |SHAP value|")
    ax.set_title(f"Feature importance ({bundle['name']})")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "shap_importance.png", dpi=120)
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    main()
