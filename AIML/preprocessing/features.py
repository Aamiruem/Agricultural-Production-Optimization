"""Loading, validation and splitting of the crop dataset."""
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from AIML.config import DATA_PATH, FEATURES, RANDOM_STATE, TARGET, TEST_SIZE

# Physically plausible ranges; rows outside them indicate corrupt data.
VALID_RANGES = {
    "N": (0, 200),
    "P": (0, 200),
    "K": (0, 250),
    "temperature": (-10, 55),
    "humidity": (0, 100),
    "ph": (0, 14),
    "rainfall": (0, 500),
}


class DatasetError(ValueError):
    """Raised when the dataset does not match the expected schema."""


def validate_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in [*FEATURES, TARGET] if c not in df.columns]
    if missing:
        raise DatasetError(f"Missing columns: {missing}")
    if df[FEATURES].isna().any().any() or df[TARGET].isna().any():
        raise DatasetError("Dataset contains missing values")
    if not all(np.issubdtype(df[c].dtype, np.number) for c in FEATURES):
        raise DatasetError("Feature columns must be numeric")
    for col, (lo, hi) in VALID_RANGES.items():
        if not df[col].between(lo, hi).all():
            raise DatasetError(f"Column {col!r} has values outside [{lo}, {hi}]")
    if df[TARGET].nunique() < 2:
        raise DatasetError("Need at least two crop labels")
    return df


def load_dataset(path=DATA_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} not found. Run `python -m AIML.data.download` first."
        )
    df = pd.read_csv(path)
    df[TARGET] = df[TARGET].str.strip().str.lower()
    return validate_dataframe(df.drop_duplicates())


@dataclass
class Split:
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: np.ndarray  # integer-encoded labels
    y_test: np.ndarray
    encoder: LabelEncoder

    @property
    def classes(self) -> list[str]:
        return [str(c) for c in self.encoder.classes_]


def split_dataset(df: pd.DataFrame) -> Split:
    """Stratified train/test split with integer-encoded labels (needed by XGBoost)."""
    encoder = LabelEncoder().fit(df[TARGET])
    y = encoder.transform(df[TARGET])
    X_train, X_test, y_train, y_test = train_test_split(
        df[FEATURES], y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    return Split(X_train, X_test, y_train, y_test, encoder)
