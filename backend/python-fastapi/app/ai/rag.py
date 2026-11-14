"""Retrieval-augmented generation: chunk → embed → store → hybrid search.

* Chunking: one chunk per "## " section of each knowledge-base Markdown file.
* Embeddings: Hugging Face sentence-transformers (all-MiniLM-L6-v2) when
  installed, otherwise a TF-IDF embedder fitted on the corpus (no downloads).
* Vector store: Qdrant when QDRANT_URL is set, otherwise an in-process
  NumPy store with the same interface.
* Search: hybrid score = 0.75 × vector cosine + 0.25 × keyword overlap,
  which reranks results so exact agronomy terms (e.g. "DAP") are not missed.
"""

import logging
import re
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np

from app.core.config import get_settings

logger = logging.getLogger(__name__)
KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"
VECTOR_WEIGHT = 0.75
_WORD = re.compile(r"[a-z0-9]+")
_STOPWORDS = frozenset(
    "a an and are as at be by for from how i in is it my of on or the to what when which with "
    "should can do does my me we you your".split()
)


@dataclass(frozen=True)
class Chunk:
    id: str
    source: str  # file stem, e.g. "fertilizers-india"
    title: str  # "Common fertilizers in India › Timing and splitting nitrogen"
    text: str


def load_chunks(directory: Path = KNOWLEDGE_DIR) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in sorted(directory.glob("*.md")):
        doc_title, section, lines = path.stem, None, []

        def flush():
            body = " ".join(line.strip() for line in lines if line.strip())
            if section and body:
                chunks.append(Chunk(f"{path.stem}#{len(chunks)}", path.stem, f"{doc_title} › {section}", body))

        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                doc_title = line[2:].strip()
            elif line.startswith("## "):
                flush()
                section, lines = line[3:].strip(), []
            else:
                lines.append(line)
        flush()
    return chunks


def _tokens(text: str) -> set[str]:
    return {t for t in _WORD.findall(text.lower()) if t not in _STOPWORDS and len(t) > 1}


# ---------------------------------------------------------------- embedders
class Embedder(Protocol):
    name: str

    def fit(self, texts: list[str]) -> None: ...
    def embed(self, texts: list[str]) -> np.ndarray: ...


class TfidfEmbedder:
    name = "tfidf"

    def fit(self, texts: list[str]) -> None:
        from sklearn.feature_extraction.text import TfidfVectorizer

        self._vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english").fit(texts)

    def embed(self, texts: list[str]) -> np.ndarray:
        m = self._vec.transform(texts).toarray().astype(np.float32)
        norms = np.linalg.norm(m, axis=1, keepdims=True)
        return m / np.where(norms == 0, 1, norms)


class SentenceTransformerEmbedder:
    name = "sentence-transformers/all-MiniLM-L6-v2"

    def __init__(self):
        from sentence_transformers import SentenceTransformer  # Hugging Face model hub

        self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def fit(self, texts: list[str]) -> None:  # pretrained: nothing to fit
        pass

    def embed(self, texts: list[str]) -> np.ndarray:
        return np.asarray(self._model.encode(texts, normalize_embeddings=True), dtype=np.float32)


def make_embedder(kind: str) -> Embedder:
    if kind in ("auto", "sentence-transformers"):
        try:
            return SentenceTransformerEmbedder()
        except Exception as exc:  # ImportError, blocked DLLs, offline model hub...
            if kind == "sentence-transformers":
                raise
            logger.info("sentence-transformers unavailable (%s); using TF-IDF embeddings", exc)
    return TfidfEmbedder()


# ------------------------------------------------------------ vector stores
class InMemoryVectorStore:
    name = "in-memory"

    def __init__(self):
        self._vectors = np.zeros((0, 0), dtype=np.float32)
        self._chunks: list[Chunk] = []

    def index(self, chunks: list[Chunk], vectors: np.ndarray) -> None:
        self._chunks, self._vectors = list(chunks), vectors

    def search(self, vector: np.ndarray, limit: int) -> list[tuple[Chunk, float]]:
        if not self._chunks:
            return []
        sims = self._vectors @ vector
        order = np.argsort(-sims)[:limit]
        return [(self._chunks[i], float(sims[i])) for i in order]


class QdrantVectorStore:
    name = "qdrant"

    def __init__(self, url: str, collection: str):
        from qdrant_client import QdrantClient

        self._client = QdrantClient(url=url)
        self._collection = collection

    def index(self, chunks: list[Chunk], vectors: np.ndarray) -> None:
        from qdrant_client.models import Distance, PointStruct, VectorParams

        if self._client.collection_exists(self._collection):
            self._client.delete_collection(self._collection)
        self._client.create_collection(
            self._collection, vectors_config=VectorParams(size=vectors.shape[1], distance=Distance.COSINE)
        )
        self._client.upsert(
            self._collection,
            points=[
                PointStruct(id=i, vector=v.tolist(), payload=c.__dict__)
                for i, (c, v) in enumerate(zip(chunks, vectors))
            ],
        )

    def search(self, vector: np.ndarray, limit: int) -> list[tuple[Chunk, float]]:
        res = self._client.query_points(self._collection, query=vector.tolist(), limit=limit)
        return [(Chunk(**p.payload), float(p.score)) for p in res.points]


# ---------------------------------------------------------------- retriever
@dataclass
class Hit:
    chunk: Chunk
    score: float


class KnowledgeBase:
    def __init__(self, chunks: list[Chunk], embedder: Embedder, store):
        self.chunks, self.embedder, self.store = chunks, embedder, store
        embedder.fit([c.title + " " + c.text for c in chunks])
        store.index(chunks, embedder.embed([c.title + " " + c.text for c in chunks]))
        self._tokens = {c.id: _tokens(c.title + " " + c.text) for c in chunks}

    def search(self, query: str, k: int = 4) -> list[Hit]:
        query_vec = self.embedder.embed([query])[0]
        candidates = self.store.search(query_vec, limit=max(k * 3, 10))
        q_tokens = _tokens(query)
        hits = []
        for chunk, vec_score in candidates:
            overlap = len(q_tokens & self._tokens.get(chunk.id, _tokens(chunk.text))) / max(len(q_tokens), 1)
            hits.append(Hit(chunk, VECTOR_WEIGHT * vec_score + (1 - VECTOR_WEIGHT) * overlap))
        hits.sort(key=lambda h: h.score, reverse=True)
        return [h for h in hits[:k] if h.score > 0.05]


_kb: KnowledgeBase | None = None
_kb_lock = threading.Lock()


def get_knowledge_base() -> KnowledgeBase:
    global _kb
    with _kb_lock:
        if _kb is None:
            s = get_settings()
            store = InMemoryVectorStore()
            if s.qdrant_url:
                try:
                    store = QdrantVectorStore(s.qdrant_url, s.qdrant_collection)
                except Exception as exc:
                    logger.warning("Qdrant unavailable (%s); using in-memory vector store", exc)
            _kb = KnowledgeBase(load_chunks(), make_embedder(s.embeddings), store)
            logger.info(
                "Knowledge base: %d chunks, embedder=%s, store=%s", len(_kb.chunks), _kb.embedder.name, _kb.store.name
            )
        return _kb
