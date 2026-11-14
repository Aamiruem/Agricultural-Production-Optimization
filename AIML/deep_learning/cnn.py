"""Convolutional neural network for leaf images (PyTorch), built layer by layer:
Conv → BatchNorm → ReLU → MaxPool blocks, global average pooling and a linear
classifier. Used by `AIML.computer_vision.train_classifier` (which also offers
transfer learning with pretrained ResNet / Vision Transformer backbones).

    python -m AIML.deep_learning.cnn    # prints the architecture and parameter count
"""

from __future__ import annotations


def build_leaf_cnn(n_classes: int, channels: tuple[int, ...] = (32, 64, 128, 256), dropout: float = 0.3):
    from torch import nn

    blocks, c_in = [], 3
    for c_out in channels:
        blocks += [
            nn.Conv2d(c_in, c_out, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c_out),
            nn.ReLU(inplace=True),
            nn.Conv2d(c_out, c_out, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c_out),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),  # halves height and width
        ]
        c_in = c_out
    return nn.Sequential(
        *blocks,
        nn.AdaptiveAvgPool2d(1),  # works for any input size
        nn.Flatten(),
        nn.Dropout(dropout),
        nn.Linear(c_in, n_classes),
    )


if __name__ == "__main__":
    import torch

    model = build_leaf_cnn(n_classes=38)  # PlantVillage has 38 classes
    out = model(torch.randn(2, 3, 224, 224))
    print(model)
    print("output", tuple(out.shape), "params", sum(p.numel() for p in model.parameters()))
