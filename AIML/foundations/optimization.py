"""Calculus & optimisation: gradients and the optimisers deep learning uses.

Fits linear regression by minimising mean squared error with
* plain gradient descent, momentum and Adam (analytic gradients), and
* checks the analytic gradient against a numerical (finite-difference) one.

    python -m AIML.foundations.optimization
"""
from __future__ import annotations

from collections.abc import Callable

import numpy as np


def mse_loss_and_grad(w: np.ndarray, X: np.ndarray, y: np.ndarray) -> tuple[float, np.ndarray]:
    """L = 1/n ‖Xw − y‖²,  ∇L = 2/n Xᵀ(Xw − y)  (chain rule)."""
    r = X @ w - y
    return float(r @ r / len(y)), 2 * X.T @ r / len(y)


def numerical_grad(f: Callable[[np.ndarray], float], w: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """Central differences: (f(w+ε) − f(w−ε)) / 2ε per coordinate."""
    g = np.zeros_like(w)
    for i in range(len(w)):
        e = np.zeros_like(w)
        e[i] = eps
        g[i] = (f(w + e) - f(w - e)) / (2 * eps)
    return g


def optimise(X: np.ndarray, y: np.ndarray, method: str = "adam", lr: float = 0.05, steps: int = 2000,
             beta1: float = 0.9, beta2: float = 0.999, eps: float = 1e-8) -> tuple[np.ndarray, list[float]]:
    w = np.zeros(X.shape[1])
    m = np.zeros_like(w)  # 1st moment / velocity
    v = np.zeros_like(w)  # 2nd moment
    history = []
    for t in range(1, steps + 1):
        loss, g = mse_loss_and_grad(w, X, y)
        history.append(loss)
        if method == "gd":
            w -= lr * g
        elif method == "momentum":
            m = beta1 * m + g
            w -= lr * m
        elif method == "adam":
            m = beta1 * m + (1 - beta1) * g
            v = beta2 * v + (1 - beta2) * g**2
            m_hat, v_hat = m / (1 - beta1**t), v / (1 - beta2**t)  # bias correction
            w -= lr * m_hat / (np.sqrt(v_hat) + eps)
        else:
            raise ValueError(method)
    return w, history


if __name__ == "__main__":
    rng = np.random.default_rng(0)
    X = np.column_stack([np.ones(200), rng.normal(size=(200, 3))])
    y = X @ np.array([2.0, -1.0, 0.5, 3.0]) + rng.normal(scale=0.1, size=200)
    for method in ("gd", "momentum", "adam"):
        w, hist = optimise(X, y, method, lr=0.01 if method == "momentum" else 0.05)
        print(f"{method:9s} loss {hist[-1]:.4f}  w={w.round(2)}")
