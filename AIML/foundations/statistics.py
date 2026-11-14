"""Probability & statistics on real yield data.

* Descriptive statistics and a bootstrap confidence interval for median yield
* Welch's t-test: is rice yield in Punjab higher than in Uttar Pradesh?
* One-way ANOVA: does wheat yield differ by state?
* Chi-square test of independence: season vs crop group
* Pearson / Spearman correlation: rainfall vs yield

    python -m AIML.foundations.statistics
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats

from AIML.config import YIELD_DATA_PATH


def load_yield() -> pd.DataFrame:
    df = pd.read_csv(YIELD_DATA_PATH)
    for col in ("Crop", "Season", "State"):
        df[col] = df[col].str.strip()
    return df[(df["Area"] > 0) & (df["Crop"] != "Coconut")]


def bootstrap_ci(
    x: np.ndarray, stat=np.median, n: int = 2000, alpha: float = 0.05, seed: int = 0
) -> tuple[float, float]:
    rng = np.random.default_rng(seed)
    samples = [stat(rng.choice(x, size=len(x), replace=True)) for _ in range(n)]
    return float(np.quantile(samples, alpha / 2)), float(np.quantile(samples, 1 - alpha / 2))


def compare_two_groups(a: np.ndarray, b: np.ndarray) -> dict:
    """Welch's t-test (unequal variances) + Cohen's d effect size."""
    t, p = stats.ttest_ind(a, b, equal_var=False)
    pooled = np.sqrt((a.var(ddof=1) + b.var(ddof=1)) / 2)
    return {
        "t": float(t),
        "p_value": float(p),
        "cohens_d": float((a.mean() - b.mean()) / pooled),
        "mean_a": float(a.mean()),
        "mean_b": float(b.mean()),
    }


def analyse(df: pd.DataFrame) -> dict:
    rice = df[df["Crop"] == "Rice"]
    punjab = rice.loc[rice["State"] == "Punjab", "Yield"].to_numpy()
    up = rice.loc[rice["State"] == "Uttar Pradesh", "Yield"].to_numpy()

    wheat = df[df["Crop"] == "Wheat"]
    big_states = wheat["State"].value_counts().head(5).index
    anova = stats.f_oneway(*[wheat.loc[wheat["State"] == s, "Yield"] for s in big_states])

    pulses = {"Arhar/Tur", "Gram", "Masoor", "Moong(Green Gram)", "Urad", "Moth", "Other Kharif pulses"}
    table = pd.crosstab(df["Season"], df["Crop"].isin(pulses).map({True: "pulse", False: "other"}))
    chi2, chi_p, dof, _ = stats.chi2_contingency(table)

    return {
        "rows": len(df),
        "median_yield_rice_ci95": bootstrap_ci(rice["Yield"].to_numpy()),
        "rice_punjab_vs_up": compare_two_groups(punjab, up),
        "wheat_anova_top5_states": {"F": float(anova.statistic), "p_value": float(anova.pvalue)},
        "season_vs_pulse_chi2": {"chi2": float(chi2), "dof": int(dof), "p_value": float(chi_p)},
        "rainfall_vs_rice_yield": {
            "pearson": float(stats.pearsonr(rice["Annual_Rainfall"], rice["Yield"]).statistic),
            "spearman": float(stats.spearmanr(rice["Annual_Rainfall"], rice["Yield"]).statistic),
        },
    }


if __name__ == "__main__":
    import json

    print(json.dumps(analyse(load_yield()), indent=2))
