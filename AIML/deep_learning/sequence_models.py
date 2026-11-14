"""Sequence models (RNN, LSTM, GRU) forecasting the next 7 days of reference
evapotranspiration (ET0, mm/day) from 30 days of real weather (Open-Meteo ERA5,
Ludhiana 2015-2024). ET0 drives irrigation scheduling, so this is the
forecasting half of irrigation optimisation.

Compared against a seasonal-naive baseline (repeat the last week), as any
forecast should be.

    python -m AIML.deep_learning.sequence_models     # needs torch
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from AIML.config import WEATHER_DATA_PATH

FEATURES = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "et0_fao_evapotranspiration",
    "relative_humidity_2m_mean",
]
TARGET = "et0_fao_evapotranspiration"


def make_windows(values: np.ndarray, target_idx: int, window: int, horizon: int) -> tuple[np.ndarray, np.ndarray]:
    """Sliding windows: X[i] = values[i:i+window], y[i] = target[i+window : i+window+horizon]."""
    n = len(values) - window - horizon + 1
    X = np.stack([values[i : i + window] for i in range(n)])
    y = np.stack([values[i + window : i + window + horizon, target_idx] for i in range(n)])
    return X.astype(np.float32), y.astype(np.float32)


def load_weather_windows(window: int = 30, horizon: int = 7, test_from: str = "2023-01-01") -> dict:
    df = pd.read_csv(WEATHER_DATA_PATH, parse_dates=["date"]).sort_values("date")
    df[FEATURES] = df[FEATURES].interpolate().bfill()
    train_mask = df["date"] < test_from
    mu, sd = df.loc[train_mask, FEATURES].mean(), df.loc[train_mask, FEATURES].std()
    scaled = ((df[FEATURES] - mu) / sd).to_numpy()
    t = FEATURES.index(TARGET)
    split = int(train_mask.sum())
    X_tr, y_tr = make_windows(scaled[:split], t, window, horizon)
    X_te, y_te = make_windows(scaled[split - window :], t, window, horizon)
    return {
        "X_train": X_tr,
        "y_train": y_tr,
        "X_test": X_te,
        "y_test": y_te,
        "target_mean": float(mu[TARGET]),
        "target_std": float(sd[TARGET]),
    }


def seasonal_naive_mae(data: dict) -> float:
    """Baseline: next 7 days = the last 7 observed days."""
    t = FEATURES.index(TARGET)
    pred = data["X_test"][:, -data["y_test"].shape[1] :, t]
    return float(np.abs(pred - data["y_test"]).mean() * data["target_std"])


def build_rnn(kind: str, n_features: int, horizon: int, hidden: int = 64, layers: int = 2):
    import torch
    from torch import nn

    cell = {"rnn": nn.RNN, "lstm": nn.LSTM, "gru": nn.GRU}[kind]

    class Forecaster(nn.Module):
        def __init__(self):
            super().__init__()
            self.rnn = cell(n_features, hidden, num_layers=layers, batch_first=True, dropout=0.1)
            self.head = nn.Linear(hidden, horizon)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            out, _ = self.rnn(x)
            return self.head(out[:, -1])  # last hidden state -> next `horizon` days

    return Forecaster()


def train_forecaster(model, data: dict, epochs: int = 40, lr: float = 1e-3, batch: int = 64, seed: int = 0) -> dict:
    import torch

    torch.manual_seed(seed)
    Xtr, ytr = torch.tensor(data["X_train"]), torch.tensor(data["y_train"])
    Xte, yte = torch.tensor(data["X_test"]), torch.tensor(data["y_test"])
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = torch.nn.MSELoss()
    for _ in range(epochs):
        model.train()
        for idx in torch.randperm(len(Xtr)).split(batch):
            opt.zero_grad()
            loss = loss_fn(model(Xtr[idx]), ytr[idx])
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # stabilises RNN training
            opt.step()
    model.eval()
    with torch.no_grad():
        mae = (model(Xte) - yte).abs().mean().item() * data["target_std"]
    return {"test_mae_mm_per_day": round(mae, 3), "baseline_mae_mm_per_day": round(seasonal_naive_mae(data), 3)}


if __name__ == "__main__":
    d = load_weather_windows()
    for kind in ("rnn", "lstm", "gru"):
        print(kind, train_forecaster(build_rnn(kind, d["X_train"].shape[-1], d["y_train"].shape[1]), d))
