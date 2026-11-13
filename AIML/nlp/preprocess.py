"""Text preprocessing for farmer queries (English + romanised Hindi).

normalise → tokenise → remove stopwords → stem → n-grams
Uses NLTK's Porter stemmer (no corpus download needed) and a built-in stopword
list so it works offline.
"""
from __future__ import annotations

import re
import unicodedata

from nltk.stem import PorterStemmer

_TOKEN = re.compile(r"[a-z0-9]+")
_stemmer = PorterStemmer()

STOPWORDS = frozenset(
    # English
    "a an and are as at be by can do does for from how i in is it my of on or should the this to what when "
    "where which will with me we our you your there their them they was were has have had per its also"
    # romanised Hindi
    " hai hain ka ki ke ko mein me kya kab kaise aur se par bhi tha thi"
    .split()
)

# Common romanised-Hindi farm words → English, so both languages share features.
HINGLISH = {
    "yuria": "urea", "dawai": "pesticide", "keede": "pest", "keeda": "pest", "paani": "water",
    "barish": "rain", "bhav": "price", "mandi": "market", "beej": "seed", "dhan": "paddy",
    "gehu": "wheat", "sarso": "mustard", "tamatar": "tomato", "baingan": "brinjal", "kal": "tomorrow",
    "daalna": "apply", "daalein": "apply", "dena": "give",
}


def normalise(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> list[str]:
    return [HINGLISH.get(t, t) for t in _TOKEN.findall(normalise(text))]


def preprocess(text: str, stem: bool = True) -> list[str]:
    tokens = [t for t in tokenize(text) if t not in STOPWORDS and len(t) > 1]
    return [_stemmer.stem(t) for t in tokens] if stem else tokens


def ngrams(tokens: list[str], n: int = 2) -> list[str]:
    return [" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


def analyzer(text: str) -> list[str]:
    """Feature analyzer for scikit-learn vectorizers: stems + stem bigrams."""
    toks = preprocess(text)
    return toks + ngrams(toks, 2)
