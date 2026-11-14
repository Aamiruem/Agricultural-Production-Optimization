"""Thread-safe TTL + LRU cache for model predictions.

Model inference is pure for a given model version and input, so repeated
requests (dashboards refreshing, a slider dragged back and forth, a crowd asking
about the same field) are answered from memory. ``clear()`` runs when the model
is reloaded so stale predictions are never served.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict
from collections.abc import Callable, Hashable
from typing import Any


class TTLCache:
    def __init__(self, name: str, maxsize: int = 2048, ttl_s: float = 600):
        self.name, self.maxsize, self.ttl = name, maxsize, ttl_s
        self._data: OrderedDict[Hashable, tuple[float, Any]] = OrderedDict()
        self._lock = threading.Lock()
        self.hits = self.misses = 0

    def get_or_compute(self, key: Hashable, compute: Callable[[], Any]) -> Any:
        if self.maxsize <= 0:
            return compute()
        now = time.monotonic()
        with self._lock:
            item = self._data.get(key)
            if item is not None and item[0] > now:
                self._data.move_to_end(key)
                self.hits += 1
                return item[1]
            self.misses += 1
        value = compute()  # outside the lock: concurrent misses may compute twice, never block each other
        with self._lock:
            self._data[key] = (now + self.ttl, value)
            self._data.move_to_end(key)
            while len(self._data) > self.maxsize:
                self._data.popitem(last=False)
        return value

    def clear(self) -> None:
        with self._lock:
            self._data.clear()

    def stats(self) -> dict:
        with self._lock:
            size = len(self._data)
        lookups = self.hits + self.misses
        return {
            "name": self.name,
            "size": size,
            "maxsize": self.maxsize,
            "ttl_s": self.ttl,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(self.hits / lookups, 4) if lookups else 0.0,
        }


def rounded_key(prefix: str, values: dict, ndigits: int = 3) -> tuple:
    """Stable cache key: sorted items with floats rounded so 20.0 and 20.0000001 share an entry."""
    return (prefix, *((k, round(v, ndigits) if isinstance(v, float) else v) for k, v in sorted(values.items())))


_registry: dict[str, TTLCache] = {}


def get_cache(name: str, maxsize: int | None = None, ttl_s: float | None = None) -> TTLCache:
    if name not in _registry:
        from app.core.config import get_settings

        s = get_settings()
        _registry[name] = TTLCache(
            name,
            maxsize if maxsize is not None else s.prediction_cache_size,
            ttl_s if ttl_s is not None else s.prediction_cache_ttl_s,
        )
    return _registry[name]


def all_stats() -> list[dict]:
    return [c.stats() for c in _registry.values()]


def clear_all() -> None:
    for c in _registry.values():
        c.clear()
