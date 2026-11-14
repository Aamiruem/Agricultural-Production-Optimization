"""Exploratory data analysis: summary statistics, correlations and plots.

python -m AIML.eda      # writes AIML/reports/eda_*.{json,png}
"""

import json

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from AIML.config import FEATURES, REPORTS_DIR, TARGET  # noqa: E402
from AIML.preprocessing.features import load_dataset  # noqa: E402


def main() -> dict:
    df = load_dataset()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    summary = {
        "rows": len(df),
        "class_counts": df[TARGET].value_counts().sort_index().to_dict(),
        "describe": df[FEATURES].describe().round(3).to_dict(),
        "correlation": df[FEATURES].corr().round(3).to_dict(),
        "per_crop_mean": df.groupby(TARGET)[FEATURES].mean().round(2).to_dict(orient="index"),
    }
    (REPORTS_DIR / "eda_summary.json").write_text(json.dumps(summary, indent=2))

    # Feature distributions
    fig, axes = plt.subplots(2, 4, figsize=(14, 6))
    for ax, col in zip(axes.flat, FEATURES):
        ax.hist(df[col], bins=30, color="#2e7d32", alpha=0.85)
        ax.set_title(col)
    axes.flat[-1].axis("off")
    fig.suptitle("Feature distributions")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "eda_distributions.png", dpi=110)
    plt.close(fig)

    # Correlation heatmap
    corr = df[FEATURES].corr().to_numpy()
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
    ax.set_xticks(range(len(FEATURES)), FEATURES, rotation=45, ha="right")
    ax.set_yticks(range(len(FEATURES)), FEATURES)
    for i in range(len(FEATURES)):
        for j in range(len(FEATURES)):
            ax.text(j, i, f"{corr[i, j]:.2f}", ha="center", va="center", fontsize=7)
    fig.colorbar(im)
    ax.set_title("Feature correlation")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "eda_correlation.png", dpi=110)
    plt.close(fig)

    strongest = np.unravel_index(np.abs(np.triu(corr, 1)).argmax(), corr.shape)
    print(
        f"{len(df)} rows, {df[TARGET].nunique()} crops; strongest correlation: "
        f"{FEATURES[strongest[0]]} vs {FEATURES[strongest[1]]} = {corr[strongest]:.2f}"
    )
    return summary


if __name__ == "__main__":
    main()
