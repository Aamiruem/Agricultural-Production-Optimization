"""A neural network from scratch in NumPy — forward pass, backpropagation,
mini-batch SGD with momentum, ReLU, softmax + cross-entropy, L2 and early stopping.

Trained on the real crop-recommendation data (22 classes). No framework: every
gradient is derived with the chain rule below, and `gradient_check` verifies them.

    python -m AIML.deep_learning.numpy_nn
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np


def relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(0, x)


def softmax(z: np.ndarray) -> np.ndarray:
    z = z - z.max(axis=1, keepdims=True)  # numerical stability
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)


@dataclass
class MLP:
    sizes: list[int]
    l2: float = 1e-4
    seed: int = 0
    params: dict = field(init=False)

    def __post_init__(self) -> None:
        rng = np.random.default_rng(self.seed)
        self.params = {}
        for i, (n_in, n_out) in enumerate(zip(self.sizes[:-1], self.sizes[1:])):
            self.params[f"W{i}"] = rng.normal(0, np.sqrt(2 / n_in), (n_in, n_out))  # He init for ReLU
            self.params[f"b{i}"] = np.zeros(n_out)

    @property
    def n_layers(self) -> int:
        return len(self.sizes) - 1

    def forward(self, X: np.ndarray) -> tuple[np.ndarray, list[np.ndarray]]:
        acts = [X]
        for i in range(self.n_layers):
            z = acts[-1] @ self.params[f"W{i}"] + self.params[f"b{i}"]
            acts.append(softmax(z) if i == self.n_layers - 1 else relu(z))
        return acts[-1], acts

    def loss(self, X: np.ndarray, y: np.ndarray) -> float:
        probs, _ = self.forward(X)
        ce = -np.log(probs[np.arange(len(y)), y] + 1e-12).mean()
        reg = 0.5 * self.l2 * sum(np.sum(self.params[f"W{i}"] ** 2) for i in range(self.n_layers))
        return float(ce + reg)

    def backward(self, X: np.ndarray, y: np.ndarray) -> dict[str, np.ndarray]:
        probs, acts = self.forward(X)
        grads = {}
        delta = probs.copy()
        delta[np.arange(len(y)), y] -= 1  # dL/dz for softmax + cross-entropy
        delta /= len(y)
        for i in reversed(range(self.n_layers)):
            grads[f"W{i}"] = acts[i].T @ delta + self.l2 * self.params[f"W{i}"]
            grads[f"b{i}"] = delta.sum(axis=0)
            if i > 0:
                delta = (delta @ self.params[f"W{i}"].T) * (acts[i] > 0)  # ReLU derivative
        return grads

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.forward(X)[0].argmax(axis=1)


def gradient_check(model: MLP, X: np.ndarray, y: np.ndarray, eps: float = 1e-5, n: int = 10) -> float:
    """Max relative error between backprop and finite-difference gradients."""
    grads = model.backward(X, y)
    rng = np.random.default_rng(1)
    worst = 0.0
    for name in grads:
        p = model.params[name]
        for _ in range(n):
            idx = tuple(rng.integers(0, s) for s in p.shape)
            old = p[idx]
            p[idx] = old + eps
            up = model.loss(X, y)
            p[idx] = old - eps
            down = model.loss(X, y)
            p[idx] = old
            num = (up - down) / (2 * eps)
            worst = max(worst, abs(num - grads[name][idx]) / max(1e-8, abs(num) + abs(grads[name][idx])))
    return worst


def train(
    model: MLP,
    X: np.ndarray,
    y: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    *,
    epochs: int = 300,
    lr: float = 0.05,
    momentum: float = 0.9,
    batch: int = 64,
    patience: int = 20,
) -> list[dict]:
    rng = np.random.default_rng(model.seed)
    velocity = {k: np.zeros_like(v) for k, v in model.params.items()}
    best, best_params, waited, history = np.inf, None, 0, []
    for epoch in range(epochs):
        order = rng.permutation(len(X))
        for start in range(0, len(X), batch):
            idx = order[start : start + batch]
            for k, g in model.backward(X[idx], y[idx]).items():
                velocity[k] = momentum * velocity[k] - lr * g
                model.params[k] += velocity[k]
        val_loss = model.loss(X_val, y_val)
        history.append({"epoch": epoch, "val_loss": val_loss, "val_acc": float((model.predict(X_val) == y_val).mean())})
        if val_loss < best - 1e-4:
            best, best_params, waited = val_loss, {k: v.copy() for k, v in model.params.items()}, 0
        elif (waited := waited + 1) >= patience:
            break
    model.params = best_params or model.params
    return history


if __name__ == "__main__":
    from AIML.preprocessing.features import load_dataset, split_dataset

    s = split_dataset(load_dataset())
    mu, sd = s.X_train.mean(), s.X_train.std()
    Xtr, Xte = ((s.X_train - mu) / sd).to_numpy(), ((s.X_test - mu) / sd).to_numpy()
    net = MLP([Xtr.shape[1], 64, 64, len(s.classes)])
    print("gradient check (max rel. error):", f"{gradient_check(net, Xtr[:32], s.y_train[:32]):.2e}")
    hist = train(net, Xtr, s.y_train, Xte, s.y_test)
    print(f"epochs={len(hist)} test accuracy={(net.predict(Xte) == s.y_test).mean():.3f}")
