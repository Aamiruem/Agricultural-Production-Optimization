"""Plant-disease image classification with PyTorch (torchvision).

Backbones
  --arch cnn       the from-scratch CNN in deep_learning/cnn.py
  --arch resnet18  transfer learning from ImageNet (fine-tune the last block + head)
  --arch vit_b_16  Vision Transformer, pretrained, new classification head

Data: an ImageFolder tree (one sub-folder per class), e.g. the public
PlantVillage dataset (38 classes):  data/plantvillage/{train,val}/<class>/*.jpg
Get it from https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset

    python -m AIML.computer_vision.train_classifier --data data/plantvillage --arch resnet18 --epochs 5
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from AIML.config import MODELS_DIR


def build_model(arch: str, n_classes: int):
    from torch import nn
    from torchvision import models

    if arch == "cnn":
        from AIML.deep_learning.cnn import build_leaf_cnn

        return build_leaf_cnn(n_classes)
    if arch == "resnet18":
        m = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        for name, p in m.named_parameters():
            p.requires_grad = name.startswith(("layer4", "fc"))  # fine-tune last block only
        m.fc = nn.Linear(m.fc.in_features, n_classes)
        return m
    if arch == "vit_b_16":
        m = models.vit_b_16(weights=models.ViT_B_16_Weights.DEFAULT)
        for p in m.parameters():
            p.requires_grad = False
        m.heads.head = nn.Linear(m.heads.head.in_features, n_classes)
        return m
    raise ValueError(arch)


def loaders(data_dir: Path, batch: int = 32):
    from torch.utils.data import DataLoader
    from torchvision import datasets, transforms

    norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    train_tf = transforms.Compose([  # data augmentation
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)), transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.2, 0.2, 0.2), transforms.ToTensor(), norm])
    eval_tf = transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(), norm])
    train = datasets.ImageFolder(data_dir / "train", train_tf)
    val = datasets.ImageFolder(data_dir / "val", eval_tf)
    return (DataLoader(train, batch, shuffle=True, num_workers=2), DataLoader(val, batch, num_workers=2), train.classes)


def run(data_dir: Path, arch: str, epochs: int, lr: float) -> dict:
    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    train_dl, val_dl, classes = loaders(data_dir)
    model = build_model(arch, len(classes)).to(device)
    opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    loss_fn = torch.nn.CrossEntropyLoss(label_smoothing=0.1)
    history = []
    for epoch in range(epochs):
        model.train()
        for x, y in train_dl:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss_fn(model(x), y).backward()
            opt.step()
        sched.step()
        model.eval()
        correct = total = 0
        with torch.no_grad():
            for x, y in val_dl:
                correct += (model(x.to(device)).argmax(1).cpu() == y).sum().item()
                total += len(y)
        history.append({"epoch": epoch + 1, "val_accuracy": correct / total})
        print(history[-1])
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    torch.save({"arch": arch, "classes": classes, "state_dict": model.state_dict()}, MODELS_DIR / f"leaf_{arch}.pt")
    return {"classes": len(classes), "history": history}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, required=True)
    ap.add_argument("--arch", default="resnet18", choices=["cnn", "resnet18", "vit_b_16"])
    ap.add_argument("--epochs", type=int, default=5)
    ap.add_argument("--lr", type=float, default=3e-4)
    a = ap.parse_args()
    print(json.dumps(run(a.data, a.arch, a.epochs, a.lr), indent=2))
