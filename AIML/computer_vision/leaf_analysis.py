"""Classical computer vision for leaf images with OpenCV (no training data needed).

Pipeline
1. Resize + denoise (Gaussian blur)
2. Segment the leaf from the background in HSV colour space (+ morphology)
3. Vegetation index ExG = 2G − R − B (excess green) over leaf pixels
4. Find lesions: leaf pixels that are yellow/brown (HSV hue bands), grouped
   into connected components (contours) with area filtering
5. Report leaf coverage, greenness, lesion %, lesion count and a severity grade

This is a screening aid; for a diagnosis use the trained CNN classifier
(`train_classifier.py`) or an agronomist.

    python -m AIML.computer_vision.leaf_analysis path/to/leaf.jpg [--out annotated.jpg]
"""
from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass

import cv2
import numpy as np

# HSV ranges (OpenCV hue is 0-179)
GREEN = ((25, 40, 40), (90, 255, 255))
YELLOW_BROWN = ((5, 50, 30), (25, 255, 230))
MIN_LESION_PX = 30


@dataclass
class LeafReport:
    leaf_coverage_pct: float  # share of the image that is leaf
    greenness_exg: float  # mean excess-green index over the leaf (−1..2, scaled)
    lesion_pct: float  # share of leaf area that is yellow/brown
    lesion_count: int
    severity: str  # healthy | mild | moderate | severe
    advice: str


def _severity(lesion_pct: float) -> tuple[str, str]:
    if lesion_pct < 2:
        return "healthy", "No significant spotting detected."
    if lesion_pct < 10:
        return "mild", "Early spotting: inspect nearby plants and remove affected leaves."
    if lesion_pct < 25:
        return "moderate", "Spreading lesions: identify the cause (fungal/bacterial/nutrient) and consider treatment."
    return "severe", "Extensive damage: consult your local Krishi Vigyan Kendra for diagnosis and treatment."


def analyse(image_bgr: np.ndarray) -> tuple[LeafReport, np.ndarray]:
    if image_bgr is None or image_bgr.ndim != 3:
        raise ValueError("expected a colour image")
    img = cv2.resize(image_bgr, (512, int(512 * image_bgr.shape[0] / image_bgr.shape[1])))
    img = cv2.GaussianBlur(img, (5, 5), 0)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    green = cv2.inRange(hsv, *map(np.array, GREEN))
    lesion = cv2.inRange(hsv, *map(np.array, YELLOW_BROWN))
    leaf = cv2.bitwise_or(green, lesion)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    leaf = cv2.morphologyEx(leaf, cv2.MORPH_CLOSE, kernel)  # fill small holes
    leaf = cv2.morphologyEx(leaf, cv2.MORPH_OPEN, kernel)  # remove specks

    # Keep the largest connected region as the leaf.
    contours, _ = cv2.findContours(leaf, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        report = LeafReport(0.0, 0.0, 0.0, 0, "unknown", "No leaf found — photograph one leaf on a plain background.")
        return report, img
    leaf_mask = np.zeros_like(leaf)
    cv2.drawContours(leaf_mask, [max(contours, key=cv2.contourArea)], -1, 255, cv2.FILLED)

    lesion_on_leaf = cv2.bitwise_and(lesion, leaf_mask)
    spots, _ = cv2.findContours(lesion_on_leaf, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    spots = [c for c in spots if cv2.contourArea(c) >= MIN_LESION_PX]

    leaf_px = int(np.count_nonzero(leaf_mask))
    lesion_px = int(np.count_nonzero(lesion_on_leaf))
    b, g, r = (img[..., i].astype(float) / 255 for i in range(3))
    exg = (2 * g - r - b)[leaf_mask > 0].mean()
    lesion_pct = 100 * lesion_px / max(leaf_px, 1)
    severity, advice = _severity(lesion_pct)

    annotated = img.copy()
    cv2.drawContours(annotated, [max(contours, key=cv2.contourArea)], -1, (0, 200, 0), 2)
    cv2.drawContours(annotated, spots, -1, (0, 0, 255), 2)
    report = LeafReport(
        leaf_coverage_pct=round(100 * leaf_px / leaf_mask.size, 1),
        greenness_exg=round(float(exg), 3),
        lesion_pct=round(lesion_pct, 1),
        lesion_count=len(spots),
        severity=severity,
        advice=advice,
    )
    return report, annotated


def analyse_bytes(data: bytes) -> LeafReport:
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("not a readable image")
    return analyse(img)[0]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image")
    parser.add_argument("--out")
    args = parser.parse_args()
    rep, ann = analyse(cv2.imread(args.image))
    print(asdict(rep))
    if args.out:
        cv2.imwrite(args.out, ann)
