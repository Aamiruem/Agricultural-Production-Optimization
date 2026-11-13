"""Attention & Transformers.

* `scaled_dot_product_attention` and `multi_head_attention` in pure NumPy
  (softmax(QKᵀ/√d)·V, with masking) — readable reference implementations.
* `TimeSeriesTransformer` (PyTorch): positional encoding + TransformerEncoder
  to forecast the next days of reference evapotranspiration (ET0) from the
  real Ludhiana weather history.

    python -m AIML.deep_learning.attention          # trains the PyTorch model (needs torch)
"""
from __future__ import annotations

import math

import numpy as np


def softmax(x: np.ndarray, axis: int = -1) -> np.ndarray:
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)


def scaled_dot_product_attention(Q: np.ndarray, K: np.ndarray, V: np.ndarray,
                                 mask: np.ndarray | None = None) -> tuple[np.ndarray, np.ndarray]:
    """Q: (..., Tq, d)  K: (..., Tk, d)  V: (..., Tk, dv). mask True = blocked."""
    scores = Q @ np.swapaxes(K, -1, -2) / math.sqrt(Q.shape[-1])
    if mask is not None:
        scores = np.where(mask, -1e9, scores)
    weights = softmax(scores, axis=-1)
    return weights @ V, weights


def causal_mask(t: int) -> np.ndarray:
    """Position i may only attend to positions ≤ i (used by decoders/forecasters)."""
    return np.triu(np.ones((t, t), dtype=bool), k=1)


def multi_head_attention(X: np.ndarray, Wq: np.ndarray, Wk: np.ndarray, Wv: np.ndarray, Wo: np.ndarray,
                         heads: int, mask: np.ndarray | None = None) -> np.ndarray:
    """Self-attention over X (T, d_model) split into `heads` subspaces."""
    T, d = X.shape
    dh = d // heads

    def split(M: np.ndarray) -> np.ndarray:  # (T, d) -> (heads, T, dh)
        return M.reshape(T, heads, dh).transpose(1, 0, 2)

    out, _ = scaled_dot_product_attention(split(X @ Wq), split(X @ Wk), split(X @ Wv), mask)
    return out.transpose(1, 0, 2).reshape(T, d) @ Wo


# ----------------------------------------------------------------- PyTorch
def build_torch_model(n_features: int, horizon: int, d_model: int = 32, heads: int = 4, layers: int = 2):
    import torch
    from torch import nn

    class PositionalEncoding(nn.Module):
        def __init__(self, d: int, max_len: int = 512):
            super().__init__()
            pos = torch.arange(max_len).unsqueeze(1)
            div = torch.exp(torch.arange(0, d, 2) * (-math.log(10000.0) / d))
            pe = torch.zeros(max_len, d)
            pe[:, 0::2], pe[:, 1::2] = torch.sin(pos * div), torch.cos(pos * div)
            self.register_buffer("pe", pe)

        def forward(self, x):
            return x + self.pe[: x.size(1)]

    class TimeSeriesTransformer(nn.Module):
        def __init__(self):
            super().__init__()
            self.inp = nn.Linear(n_features, d_model)
            self.pos = PositionalEncoding(d_model)
            layer = nn.TransformerEncoderLayer(d_model, heads, dim_feedforward=4 * d_model, dropout=0.1, batch_first=True)
            self.encoder = nn.TransformerEncoder(layer, layers)
            self.head = nn.Linear(d_model, horizon)

        def forward(self, x):  # x: (batch, window, features)
            h = self.encoder(self.pos(self.inp(x)))
            return self.head(h[:, -1])  # predict the next `horizon` values from the last position

    return TimeSeriesTransformer()


if __name__ == "__main__":
    from AIML.deep_learning.sequence_models import load_weather_windows, train_forecaster

    data = load_weather_windows(window=30, horizon=7)
    model = build_torch_model(n_features=data["X_train"].shape[-1], horizon=7)
    print(train_forecaster(model, data, epochs=30))
