"""Cleaning and feature engineering for the Indian crop-yield dataset.

Yield = Production / Area in tonnes per hectare for all crops except coconut
(counted in nuts), which is excluded. Production is never used as a feature
because yield is computed from it (target leakage).
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from AIML.config import YIELD_DATA_PATH

CATEGORICAL = ["Crop", "Season", "State"]
NUMERIC = ["Crop_Year", "log_area", "Annual_Rainfall", "fertilizer_kg_ha", "pesticide_kg_ha"]
TARGET = "Yield"
TEST_FROM_YEAR = 2015  # time-based split: train 1997-2014, test 2015-2020


def load_yield(path=YIELD_DATA_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"{path} missing — run `python -m AIML.data.download yield`")
    df = pd.read_csv(path)
    return clean(df)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in CATEGORICAL:
        df[col] = df[col].astype(str).str.strip()
    df = df[(df["Crop"] != "Coconut") & (df["Area"] > 0) & (df["Yield"] > 0)]
    df = df.drop_duplicates()
    return add_features(df).reset_index(drop=True)


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["log_area"] = np.log1p(df["Area"])
    df["fertilizer_kg_ha"] = df["Fertilizer"] / df["Area"]
    df["pesticide_kg_ha"] = df["Pesticide"] / df["Area"]
    return df


def time_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Train on the past, test on later years — how the model is used in practice."""
    return df[df["Crop_Year"] < TEST_FROM_YEAR], df[df["Crop_Year"] >= TEST_FROM_YEAR]


def history_table(df: pd.DataFrame) -> dict[str, dict]:
    """Historical yield percentiles per crop|state|season, shipped with the model for context."""
    g = df.groupby(["Crop", "State", "Season"])["Yield"]
    stats = g.agg(n="count", p25=lambda s: s.quantile(0.25), median="median", p75=lambda s: s.quantile(0.75))
    return {"|".join(k): {c: round(float(v), 3) for c, v in row.items()} for k, row in stats.iterrows()}
