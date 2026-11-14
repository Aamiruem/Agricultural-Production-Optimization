"""Object detection & segmentation with YOLO (Ultralytics).

* `detect`  — run a pretrained or fine-tuned model on images/video and count objects
              (e.g. fruits, weeds, pests) with confidence filtering.
* `train`   — fine-tune on a dataset in YOLO format (data.yaml with train/val
              images + labels), e.g. a weed or fruit-counting dataset from
              Roboflow Universe. Use a `-seg` model for instance segmentation.

    python -m AIML.computer_vision.yolo_detect detect field.jpg --model yolo11n.pt
    python -m AIML.computer_vision.yolo_detect train --data weeds/data.yaml --model yolo11n.pt --epochs 50
"""

from __future__ import annotations

import argparse
from collections import Counter


def detect(source: str, model_path: str = "yolo11n.pt", conf: float = 0.35) -> dict:
    from ultralytics import YOLO

    model = YOLO(model_path)
    counts: Counter[str] = Counter()
    for result in model.predict(source, conf=conf, verbose=False):
        for cls_id in result.boxes.cls.tolist():
            counts[model.names[int(cls_id)]] += 1
    return dict(counts.most_common())


def train(data_yaml: str, model_path: str = "yolo11n.pt", epochs: int = 50, imgsz: int = 640) -> str:
    from ultralytics import YOLO

    model = YOLO(model_path)
    results = model.train(data=data_yaml, epochs=epochs, imgsz=imgsz, patience=15)
    return str(results.save_dir)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("detect")
    d.add_argument("source")
    d.add_argument("--model", default="yolo11n.pt")
    d.add_argument("--conf", type=float, default=0.35)
    t = sub.add_parser("train")
    t.add_argument("--data", required=True)
    t.add_argument("--model", default="yolo11n.pt")
    t.add_argument("--epochs", type=int, default=50)
    a = ap.parse_args()
    print(detect(a.source, a.model, a.conf) if a.cmd == "detect" else train(a.data, a.model, a.epochs))
