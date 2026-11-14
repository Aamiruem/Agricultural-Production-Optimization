"""EDA of Indian crop yields with Seaborn (static) and Plotly (interactive).

python -m AIML.eda.yield_eda   # writes AIML/reports/yield_*.png and yield_dashboard.html
"""

from __future__ import annotations

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import plotly.express as px  # noqa: E402
import seaborn as sns  # noqa: E402

from AIML.config import REPORTS_DIR  # noqa: E402
from AIML.preprocessing.yield_features import load_yield  # noqa: E402

TOP_CROPS = ["Rice", "Wheat", "Maize", "Sugarcane", "Potato", "Cotton(lint)"]


def main() -> dict:
    df = load_yield()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="Greens_d")

    # 1. Yield distribution per crop (log scale — yields are right-skewed)
    fig, ax = plt.subplots(figsize=(9, 4))
    sns.boxplot(data=df[df["Crop"].isin(TOP_CROPS)], x="Crop", y="Yield", ax=ax, color="#66bb6a")
    ax.set_yscale("log")
    ax.set_title("Yield distribution by crop (t/ha, log scale)")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "yield_by_crop.png", dpi=110)
    plt.close(fig)

    # 2. National yield trend (area-weighted) for major crops
    trend = (
        df[df["Crop"].isin(TOP_CROPS[:4])]
        .groupby(["Crop_Year", "Crop"])
        .apply(lambda g: g["Production"].sum() / g["Area"].sum(), include_groups=False)
        .rename("yield")
        .reset_index()
    )
    fig, ax = plt.subplots(figsize=(9, 4))
    sns.lineplot(data=trend[trend["Crop_Year"] < 2020], x="Crop_Year", y="yield", hue="Crop", ax=ax)
    ax.set_title("Area-weighted national yield (t/ha)")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "yield_trend.png", dpi=110)
    plt.close(fig)

    # 3. Correlation heatmap of numeric features vs log-yield
    num = df[["log_area", "Annual_Rainfall", "fertilizer_kg_ha", "pesticide_kg_ha", "Crop_Year"]].assign(
        log_yield=np.log1p(df["Yield"])
    )
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(num.corr(), annot=True, fmt=".2f", cmap="RdBu_r", vmin=-1, vmax=1, ax=ax)
    ax.set_title("Feature correlations")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "yield_correlation.png", dpi=110)
    plt.close(fig)

    # 4. Interactive Plotly dashboard: rice yield by state over time
    rice = (
        df[df["Crop"] == "Rice"]
        .groupby(["State", "Crop_Year"])
        .apply(lambda g: g["Production"].sum() / g["Area"].sum(), include_groups=False)
        .rename("yield_t_ha")
        .reset_index()
    )
    top_states = rice.groupby("State")["yield_t_ha"].mean().nlargest(8).index
    fig = px.line(
        rice[rice["State"].isin(top_states)],
        x="Crop_Year",
        y="yield_t_ha",
        color="State",
        title="Rice yield by state (t/ha) — hover for values",
        template="plotly_white",
    )
    fig.write_html(REPORTS_DIR / "yield_dashboard.html", include_plotlyjs="cdn")

    return {
        "rows": len(df),
        "crops": df["Crop"].nunique(),
        "states": df["State"].nunique(),
        "years": [int(df["Crop_Year"].min()), int(df["Crop_Year"].max())],
    }


if __name__ == "__main__":
    print(main())
