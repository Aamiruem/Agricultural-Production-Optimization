"""PyTorch multi-layer perceptron for crop classification.

Trained with mini-batch Adam, cross-entropy loss and early stopping on a
validation split. Used as the deep-learning baseline in the model comparison.
"""
from dataclasses import dataclass

import numpy as np
import torch
from torch import nn


class CropMLP(nn.Module):
    def __init__(self, n_features: int, n_classes: int, hidden: int = 64, dropout: float = 0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_features, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, n_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # returns logits
        return self.net(x)


@dataclass
class TorchTrainResult:
    model: CropMLP
    mean: np.ndarray
    std: np.ndarray
    history: list[dict]
    best_epoch: int


def _standardize(X: np.ndarray, mean: np.ndarray, std: np.ndarray) -> torch.Tensor:
    return torch.tensor((X - mean) / std, dtype=torch.float32)


def train_mlp(
    X_train: np.ndarray,
    y_train: np.ndarray,
    n_classes: int,
    *,
    epochs: int = 300,
    lr: float = 3e-3,
    batch_size: int = 64,
    patience: int = 25,
    seed: int = 42,
) -> TorchTrainResult:
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)

    # Hold out 15% of the training data for early stopping.
    idx = rng.permutation(len(X_train))
    n_val = max(1, int(0.15 * len(idx)))
    val_idx, fit_idx = idx[:n_val], idx[n_val:]

    mean = X_train[fit_idx].mean(axis=0)
    std = X_train[fit_idx].std(axis=0) + 1e-8
    X_fit, X_val = _standardize(X_train[fit_idx], mean, std), _standardize(X_train[val_idx], mean, std)
    y_fit = torch.tensor(y_train[fit_idx], dtype=torch.long)
    y_val = torch.tensor(y_train[val_idx], dtype=torch.long)

    model = CropMLP(X_train.shape[1], n_classes)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    loss_fn = nn.CrossEntropyLoss()

    best_state, best_loss, best_epoch, waited = None, float("inf"), 0, 0
    history: list[dict] = []
    for epoch in range(1, epochs + 1):
        model.train()
        perm = torch.randperm(len(X_fit))
        for start in range(0, len(perm), batch_size):
            batch = perm[start : start + batch_size]
            optimizer.zero_grad()
            loss = loss_fn(model(X_fit[batch]), y_fit[batch])
            loss.backward()  # backpropagation
            optimizer.step()

        model.eval()
        with torch.no_grad():
            val_logits = model(X_val)
            val_loss = loss_fn(val_logits, y_val).item()
            val_acc = (val_logits.argmax(1) == y_val).float().mean().item()
        history.append({"epoch": epoch, "val_loss": val_loss, "val_accuracy": val_acc})

        if val_loss < best_loss - 1e-4:
            best_loss, best_epoch, waited = val_loss, epoch, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            waited += 1
            if waited >= patience:
                break

    if best_state is not None:
        model.load_state_dict(best_state)
    model.eval()
    return TorchTrainResult(model, mean, std, history, best_epoch)


def predict_proba(result: TorchTrainResult, X: np.ndarray) -> np.ndarray:
    with torch.no_grad():
        logits = result.model(_standardize(X, result.mean, result.std))
        return torch.softmax(logits, dim=1).numpy()
