"""Linear algebra for ML, written out explicitly and checked against NumPy.

* Matrix multiply / transpose from scratch
* Linear regression by the normal equation  w = (XᵀX)⁻¹ Xᵀy   (solved, not inverted)
* Power iteration for the dominant eigenvector (what PCA's first component is)
* PCA via SVD on centred data

    python -m AIML.foundations.linear_algebra
"""
from __future__ import annotations

import numpy as np


def matmul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    if len(a[0]) != len(b):
        raise ValueError("inner dimensions differ")
    return [[sum(a[i][k] * b[k][j] for k in range(len(b))) for j in range(len(b[0]))] for i in range(len(a))]


def transpose(a: list[list[float]]) -> list[list[float]]:
    return [list(row) for row in zip(*a)]


def normal_equation(X: np.ndarray, y: np.ndarray, ridge: float = 0.0) -> np.ndarray:
    """Least squares with an intercept column; `ridge` adds L2 regularisation."""
    Xb = np.column_stack([np.ones(len(X)), X])
    A = Xb.T @ Xb + ridge * np.eye(Xb.shape[1])
    A[0, 0] -= ridge  # don't penalise the intercept
    return np.linalg.solve(A, Xb.T @ y)  # more stable than inverting A


def power_iteration(A: np.ndarray, iters: int = 500, tol: float = 1e-10, seed: int = 0) -> tuple[float, np.ndarray]:
    """Dominant eigenvalue/vector of a symmetric matrix."""
    v = np.random.default_rng(seed).normal(size=A.shape[0])
    v /= np.linalg.norm(v)
    lam = 0.0
    for _ in range(iters):
        w = A @ v
        v_new = w / np.linalg.norm(w)
        lam_new = float(v_new @ A @ v_new)
        if abs(lam_new - lam) < tol:
            return lam_new, v_new
        v, lam = v_new, lam_new
    return lam, v


def pca(X: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Project onto the top-k principal components. Returns (scores, components, explained_ratio)."""
    Xc = X - X.mean(axis=0)
    _, s, vt = np.linalg.svd(Xc, full_matrices=False)
    explained = s**2 / np.sum(s**2)
    return Xc @ vt[:k].T, vt[:k], explained[:k]


if __name__ == "__main__":
    from AIML.config import DATA_PATH, FEATURES

    import pandas as pd

    X = pd.read_csv(DATA_PATH)[FEATURES].to_numpy(float)
    Xs = (X - X.mean(0)) / X.std(0)
    lam, v = power_iteration(np.cov(Xs, rowvar=False))
    _, comps, ratio = pca(Xs, 2)
    print(f"top eigenvalue {lam:.3f}; PC1 = {dict(zip(FEATURES, comps[0].round(2)))}")
    print(f"variance explained by PC1, PC2: {ratio.round(3)}")
