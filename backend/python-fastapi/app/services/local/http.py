"""Outbound HTTP for public data APIs: TTL caching, per-host rate limits, clear errors."""

from __future__ import annotations

import threading
import time
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import httpx
from app.core.cache import get_cache
from app.core.config import get_settings


class UpstreamError(RuntimeError):
    """A public API failed or timed out. `status` is the HTTP status to return to our client."""

    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


class RateLimiter:
    """Minimum interval between calls to one host (blocking, thread-safe)."""

    def __init__(self, min_interval_s: float):
        self.min_interval = min_interval_s
        self._next = 0.0
        self._lock = threading.Lock()

    def wait(self) -> None:
        with self._lock:
            now = time.monotonic()
            delay = self._next - now
            self._next = max(now, self._next) + self.min_interval
        if delay > 0:
            time.sleep(delay)


# Usage policies: Nominatim ≤ 1 request/s; SoilGrids ≤ 5 requests/min.
LIMITS: dict[str, RateLimiter] = {
    "nominatim.openstreetmap.org": RateLimiter(1.05),
    "rest.isric.org": RateLimiter(12.0),
}

CACHE_TTL = {
    "nominatim.openstreetmap.org": 24 * 3600,
    "api.open-meteo.com": 20 * 60,
    "archive-api.open-meteo.com": 12 * 3600,
    "rest.isric.org": 7 * 24 * 3600,
    "api.data.gov.in": 3600,
}


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def get_json(
    url: str, params: dict[str, Any] | list[tuple[str, Any]] | None = None, timeout: float | None = None
) -> Any:
    """GET JSON with caching and rate limiting. Raises UpstreamError on failure."""
    settings = get_settings()
    host = urlparse(url).hostname or ""
    items = sorted(params.items()) if isinstance(params, dict) else list(params or [])
    key = (url, tuple((k, str(v)) for k, v in items))
    cache = get_cache(f"local:{host}", maxsize=2048, ttl_s=CACHE_TTL.get(host, 600))

    def fetch() -> Any:
        if host in LIMITS:
            LIMITS[host].wait()
        try:
            r = httpx.get(
                url,
                params=items,
                timeout=timeout or settings.local_http_timeout_s,
                headers={"User-Agent": settings.nominatim_user_agent, "Accept": "application/json"},
            )
        except httpx.TimeoutException as exc:
            raise UpstreamError(f"{host} did not respond in time", 504) from exc
        except httpx.HTTPError as exc:
            raise UpstreamError(f"{host} could not be reached: {exc}", 502) from exc
        if r.status_code == 429:
            raise UpstreamError(f"{host} rate limit reached; try again shortly", 503)
        if r.status_code >= 400:
            raise UpstreamError(f"{host} returned HTTP {r.status_code}", 502)
        return r.json()

    return cache.get_or_compute(key, fetch)
