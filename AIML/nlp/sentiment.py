"""Sentiment analysis of farmer feedback — a transparent lexicon model with
negation and intensifier handling (works offline), plus an optional
transformer model for higher accuracy.

    python -m AIML.nlp.sentiment "the new seeds gave very good yield"
"""
from __future__ import annotations

import sys

from AIML.nlp.preprocess import tokenize

POSITIVE = {"good": 1, "great": 2, "excellent": 2, "healthy": 1, "increase": 1, "increased": 1, "profit": 1,
            "happy": 1, "best": 2, "improved": 1, "helpful": 1, "useful": 1, "fresh": 1, "green": 0.5, "accha": 1}
NEGATIVE = {"bad": -1, "poor": -1, "loss": -2, "damage": -2, "damaged": -2, "disease": -1, "pest": -1, "dry": -1,
            "dried": -1, "failed": -2, "fail": -2, "low": -1, "worst": -2, "expensive": -1, "late": -1,
            "useless": -2, "drought": -2, "flood": -2, "kharab": -1}
NEGATORS = {"not", "no", "never", "nahi", "na", "without"}
INTENSIFIERS = {"very": 1.5, "extremely": 2.0, "bahut": 1.5, "really": 1.3, "slightly": 0.5}


def lexicon_sentiment(text: str) -> dict:
    tokens = tokenize(text)
    score, hits = 0.0, []
    for i, tok in enumerate(tokens):
        value = POSITIVE.get(tok) or NEGATIVE.get(tok)
        if value is None:
            continue
        window = tokens[max(0, i - 3):i]
        if any(w in NEGATORS for w in window):
            value = -value * 0.8  # "not good" is negative, a bit weaker than "bad"
        for w in window:
            value *= INTENSIFIERS.get(w, 1.0)
        score += value
        hits.append(tok)
    norm = score / (abs(score) + 2)  # squash to (-1, 1)
    label = "positive" if norm > 0.15 else "negative" if norm < -0.15 else "neutral"
    return {"label": label, "score": round(norm, 3), "evidence": hits}


def transformer_sentiment(texts: list[str]) -> list[dict]:
    """Pretrained multilingual sentiment model (downloads from Hugging Face on first use)."""
    from transformers import pipeline

    clf = pipeline("sentiment-analysis", model="cardiffnlp/twitter-xlm-roberta-base-sentiment")
    return clf(texts)


if __name__ == "__main__":
    print(lexicon_sentiment(" ".join(sys.argv[1:]) or "Crop was not good, pest damage was very bad"))
