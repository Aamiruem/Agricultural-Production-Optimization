"""Retrieval-Augmented Generation, end to end, with an evaluation harness.

Chunking   fixed-size (with overlap) · recursive (paragraph → sentence) · by Markdown heading
Retrieval  BM25 (lexical, implemented here) · dense embeddings (LSA: TF-IDF + SVD, or
           Hugging Face sentence-transformers when installed) · hybrid with
           Reciprocal Rank Fusion (RRF)
Reranking  Maximal Marginal Relevance (relevance vs. diversity)
Evaluation recall@k and MRR on a labelled question set, per strategy
Generation grounded answer with citations via Claude (optional)

    python -m AIML.rag.pipeline              # evaluate all strategies
    python -m AIML.rag.pipeline --ask "How much nitrogen does urea contain?"
"""

from __future__ import annotations

import argparse
import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from AIML.config import KNOWLEDGE_DIR

_WORD = re.compile(r"[a-z0-9]+")
STOP = frozenset("a an and are as at be by for from how i in is it of on or the to what when which with".split())


def tokens(text: str) -> list[str]:
    return [t for t in _WORD.findall(text.lower()) if t not in STOP]


@dataclass(frozen=True)
class Chunk:
    id: str
    source: str
    title: str
    text: str


# ------------------------------------------------------------------ chunking
def load_docs(directory: Path = KNOWLEDGE_DIR) -> dict[str, str]:
    return {p.stem: p.read_text(encoding="utf-8") for p in sorted(directory.glob("*.md"))}


def chunk_fixed(docs: dict[str, str], size: int = 60, overlap: int = 15) -> list[Chunk]:
    """Sliding window of `size` words with `overlap` words shared between neighbours."""
    out = []
    for src, text in docs.items():
        words = re.sub(r"#+ ", "", text).split()
        for i, start in enumerate(range(0, max(len(words) - overlap, 1), size - overlap)):
            out.append(Chunk(f"{src}#f{i}", src, src, " ".join(words[start : start + size])))
    return out


def chunk_recursive(docs: dict[str, str], max_words: int = 80) -> list[Chunk]:
    """Split on paragraphs; split long paragraphs on sentences."""
    out = []
    for src, text in docs.items():
        body = "\n".join(line for line in text.splitlines() if not line.startswith("#"))  # drop headings
        for para in [" ".join(p.split()) for p in body.split("\n\n") if p.strip()]:
            pieces = [para] if len(para.split()) <= max_words else re.split(r"(?<=[.!?])\s+", para)
            buf: list[str] = []
            for piece in pieces:
                if len(" ".join(buf + [piece]).split()) > max_words and buf:
                    out.append(Chunk(f"{src}#r{len(out)}", src, src, " ".join(buf)))
                    buf = []
                buf.append(piece)
            if buf:
                out.append(Chunk(f"{src}#r{len(out)}", src, src, " ".join(buf)))
    return out


def chunk_by_heading(docs: dict[str, str]) -> list[Chunk]:
    """One chunk per '## ' section, keeping the document and section title."""
    out = []
    for src, text in docs.items():
        title, section, lines = src, None, []
        for line in text.splitlines() + ["## "]:
            if line.startswith("# "):
                title = line[2:].strip()
            elif line.startswith("## "):
                if section and any(l.strip() for l in lines):
                    out.append(
                        Chunk(
                            f"{src}#h{len(out)}",
                            src,
                            f"{title} › {section}",
                            " ".join(l.strip() for l in lines if l.strip()),
                        )
                    )
                section, lines = line[3:].strip(), []
            else:
                lines.append(line)
    return out


# ----------------------------------------------------------------- retrieval
class BM25:
    """Okapi BM25: idf · tf·(k1+1) / (tf + k1·(1 − b + b·len/avg_len))."""

    def __init__(self, chunks: list[Chunk], k1: float = 1.5, b: float = 0.75):
        self.chunks, self.k1, self.b = chunks, k1, b
        self.docs = [Counter(tokens(c.title + " " + c.text)) for c in chunks]
        self.lens = np.array([sum(d.values()) for d in self.docs], dtype=float)
        self.avg = self.lens.mean()
        df = Counter(t for d in self.docs for t in d)
        n = len(chunks)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}

    def scores(self, query: str) -> np.ndarray:
        out = np.zeros(len(self.docs))
        for t in tokens(query):
            if t not in self.idf:
                continue
            tf = np.array([d.get(t, 0) for d in self.docs], dtype=float)
            out += self.idf[t] * tf * (self.k1 + 1) / (tf + self.k1 * (1 - self.b + self.b * self.lens / self.avg))
        return out


class DenseRetriever:
    """Embeddings: sentence-transformers if available, else LSA (TF-IDF → truncated SVD)."""

    def __init__(self, chunks: list[Chunk], dim: int = 64):
        texts = [c.title + " " + c.text for c in chunks]
        try:
            from sentence_transformers import SentenceTransformer

            self._st = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            self.vectors = self._st.encode(texts, normalize_embeddings=True)
            self.name = "all-MiniLM-L6-v2"
        except Exception:
            from sklearn.decomposition import TruncatedSVD
            from sklearn.feature_extraction.text import TfidfVectorizer

            self._st = None
            self._tfidf = TfidfVectorizer(sublinear_tf=True, stop_words="english", ngram_range=(1, 2)).fit(texts)
            m = self._tfidf.transform(texts)
            self._svd = TruncatedSVD(n_components=min(dim, m.shape[1] - 1), random_state=0).fit(m)
            self.vectors = self._norm(self._svd.transform(m))
            self.name = "lsa-tfidf-svd"

    @staticmethod
    def _norm(v: np.ndarray) -> np.ndarray:
        return v / (np.linalg.norm(v, axis=1, keepdims=True) + 1e-9)

    def embed(self, query: str) -> np.ndarray:
        if self._st is not None:
            return self._st.encode([query], normalize_embeddings=True)[0]
        return self._norm(self._svd.transform(self._tfidf.transform([query])))[0]

    def scores(self, query: str) -> np.ndarray:
        return self.vectors @ self.embed(query)


def rrf(rankings: list[np.ndarray], k: int = 60) -> np.ndarray:
    """Reciprocal Rank Fusion: Σ 1 / (k + rank). Robust to different score scales."""
    fused = np.zeros(len(rankings[0]))
    for scores in rankings:
        ranks = np.empty_like(scores)
        ranks[np.argsort(-scores)] = np.arange(1, len(scores) + 1)
        fused += 1 / (k + ranks)
    return fused


def mmr(query_vec: np.ndarray, doc_vecs: np.ndarray, candidates: list[int], k: int, lam: float = 0.7) -> list[int]:
    """Maximal Marginal Relevance: pick relevant chunks that aren't near-duplicates."""
    chosen: list[int] = []
    rel = doc_vecs @ query_vec
    while candidates and len(chosen) < k:

        def score(i):
            redundancy = max((float(doc_vecs[i] @ doc_vecs[j]) for j in chosen), default=0.0)
            return lam * rel[i] - (1 - lam) * redundancy

        best = max(candidates, key=score)
        chosen.append(best)
        candidates = [c for c in candidates if c != best]
    return chosen


class Retriever:
    def __init__(self, chunks: list[Chunk]):
        self.chunks, self.bm25, self.dense = chunks, BM25(chunks), DenseRetriever(chunks)

    def search(self, query: str, k: int = 3, mode: str = "hybrid", rerank: bool = False) -> list[Chunk]:
        if mode == "bm25":
            s = self.bm25.scores(query)
        elif mode == "dense":
            s = self.dense.scores(query)
        else:
            s = rrf([self.bm25.scores(query), self.dense.scores(query)])
        top = list(np.argsort(-s)[: max(k * 4, 10)])
        idx = mmr(self.dense.embed(query), self.dense.vectors, top, k) if rerank else top[:k]
        return [self.chunks[i] for i in idx]


# ---------------------------------------------------------------- evaluation
EVAL_SET = [  # question → knowledge-base file that answers it
    ("How much nitrogen is in urea?", "fertilizers-india"),
    ("When should DAP be applied?", "fertilizers-india"),
    ("How do I collect a soil sample for testing?", "soil-testing-and-npk"),
    ("What are the symptoms of potassium deficiency?", "soil-testing-and-npk"),
    ("My soil is acidic, what should I add?", "soil-ph"),
    ("How are sodic soils reclaimed?", "soil-ph"),
    ("Which crops are grown in the rabi season?", "cropping-seasons"),
    ("Why rotate cereals with pulses?", "cropping-seasons"),
    ("How much water does rice need?", "crop-guides"),
    ("Does chickpea need nitrogen fertilizer?", "crop-guides"),
    ("How much water can drip irrigation save?", "irrigation-water"),
    ("At which growth stages is irrigation most critical for wheat?", "irrigation-water"),
]


def evaluate(chunks: list[Chunk], k: int = 3) -> dict:
    r = Retriever(chunks)
    out = {}
    for mode in ("bm25", "dense", "hybrid"):
        hits, rr = 0, 0.0
        for q, src in EVAL_SET:
            ranked = [c.source for c in r.search(q, k=10, mode=mode)]
            hits += src in ranked[:k]
            rr += 1 / (ranked.index(src) + 1) if src in ranked else 0
        out[mode] = {f"recall@{k}": round(hits / len(EVAL_SET), 3), "mrr": round(rr / len(EVAL_SET), 3)}
    out["embedder"] = r.dense.name
    return out


def answer(question: str, retriever: Retriever) -> str:
    """Grounded generation: only the retrieved passages, cited by source id."""
    import anthropic

    passages = retriever.search(question, k=3, rerank=True)
    context = "\n\n".join(f"[{c.source}] {c.title}\n{c.text}" for c in passages)
    r = anthropic.Anthropic().beta.messages.create(
        model="claude-opus-5-5",
        max_tokens=2000,
        output_config={"effort": "low"},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system="Answer using only the passages provided and cite them like [source]. "
        "If they don't contain the answer, say so.",
        messages=[{"role": "user", "content": f"Passages:\n{context}\n\nQuestion: {question}"}],
    )
    return "".join(b.text for b in r.content if b.type == "text")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ask")
    a = ap.parse_args()
    docs = load_docs()
    if a.ask:
        print(answer(a.ask, Retriever(chunk_by_heading(docs))))
    else:
        for name, chunker in (("fixed", chunk_fixed), ("recursive", chunk_recursive), ("heading", chunk_by_heading)):
            chunks = chunker(docs)
            print(f"{name:9s} chunks={len(chunks):3d}", evaluate(chunks))
