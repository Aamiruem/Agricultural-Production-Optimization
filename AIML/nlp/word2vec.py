"""Word2Vec (skip-gram with negative sampling) implemented in NumPy.

Trains word embeddings on the agronomy knowledge base + farmer queries, then
finds similar words with cosine similarity. Shows how embeddings are learned:
for each (centre, context) pair, push their vectors together and push k random
"negative" words apart, using the sigmoid loss and its gradients.

    python -m AIML.nlp.word2vec
"""
from __future__ import annotations

from collections import Counter
from pathlib import Path

import numpy as np

from AIML.nlp.preprocess import preprocess


def build_corpus(texts: list[str]) -> list[list[str]]:
    return [toks for t in texts if (toks := preprocess(t, stem=False))]


class Word2Vec:
    def __init__(self, sentences: list[list[str]], dim: int = 50, window: int = 3, negatives: int = 5,
                 min_count: int = 2, seed: int = 0):
        counts = Counter(w for s in sentences for w in s)
        self.vocab = [w for w, c in counts.most_common() if c >= min_count]
        self.index = {w: i for i, w in enumerate(self.vocab)}
        self.sentences = [[self.index[w] for w in s if w in self.index] for s in sentences]
        freq = np.array([counts[w] for w in self.vocab], dtype=float) ** 0.75  # unigram^0.75 noise distribution
        self.noise = freq / freq.sum()
        self.rng = np.random.default_rng(seed)
        self.W_in = (self.rng.random((len(self.vocab), dim)) - 0.5) / dim
        self.W_out = np.zeros((len(self.vocab), dim))
        self.window, self.negatives = window, negatives

    def pairs(self):
        for s in self.sentences:
            for i, centre in enumerate(s):
                for j in range(max(0, i - self.window), min(len(s), i + self.window + 1)):
                    if j != i:
                        yield centre, s[j]

    def train(self, epochs: int = 30, lr: float = 0.05) -> list[float]:
        sigmoid = lambda x: 1 / (1 + np.exp(-x))  # noqa: E731
        losses = []
        for epoch in range(epochs):
            total, n = 0.0, 0
            step = lr * (1 - epoch / epochs) + 1e-4  # linear decay
            for centre, ctx in self.pairs():
                targets = np.concatenate([[ctx], self.rng.choice(len(self.vocab), self.negatives, p=self.noise)])
                labels = np.zeros(len(targets))
                labels[0] = 1
                v = self.W_in[centre]
                u = self.W_out[targets]
                p = sigmoid(u @ v)
                g = p - labels  # gradient of the logistic loss wrt the scores
                self.W_in[centre] -= step * g @ u
                self.W_out[targets] -= step * np.outer(g, v)
                total -= np.log(p[0] + 1e-9) + np.log(1 - p[1:] + 1e-9).sum()
                n += 1
            losses.append(total / max(n, 1))
        return losses

    def most_similar(self, word: str, k: int = 5) -> list[tuple[str, float]]:
        if word not in self.index:
            return []
        E = self.W_in / (np.linalg.norm(self.W_in, axis=1, keepdims=True) + 1e-9)
        sims = E @ E[self.index[word]]
        best = np.argsort(-sims)[1:k + 1]
        return [(self.vocab[i], round(float(sims[i]), 3)) for i in best]


def default_texts() -> list[str]:
    from AIML.config import KNOWLEDGE_DIR

    import pandas as pd

    kb = [line for p in Path(KNOWLEDGE_DIR).glob("*.md") for line in p.read_text(encoding="utf-8").split(". ")]
    queries = pd.read_csv(Path(__file__).parent / "data" / "farmer_queries.csv")["text"].tolist()
    return kb + queries


if __name__ == "__main__":
    model = Word2Vec(build_corpus(default_texts()))
    losses = model.train(epochs=25)
    print(f"vocab={len(model.vocab)} loss {losses[0]:.3f} -> {losses[-1]:.3f}")
    for w in ("urea", "rice", "irrigation", "rain"):
        print(w, model.most_similar(w))
