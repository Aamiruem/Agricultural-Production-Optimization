"""Advanced Python used across the project: decorators, generators,
iterators, context managers, dataclasses, type hints and async I/O.

    python -m AIML.pyadvanced.toolkit
"""
from __future__ import annotations

import asyncio
import csv
import functools
import json
import logging
import time
import urllib.parse
import urllib.request
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import ParamSpec, TypeVar

log = logging.getLogger(__name__)
P = ParamSpec("P")
R = TypeVar("R")


# ----------------------------------------------------------------- decorators
def timed(fn: Callable[P, R]) -> Callable[P, R]:
    """Log how long a call takes."""

    @functools.wraps(fn)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            log.info("%s took %.3fs", fn.__qualname__, time.perf_counter() - start)

    return wrapper


def retry(times: int = 3, delay: float = 0.5, exceptions: tuple[type[BaseException], ...] = (Exception,)):
    """Retry with exponential backoff (decorator factory)."""

    def decorate(fn: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(fn)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions:
                    if attempt == times:
                        raise
                    time.sleep(delay * 2 ** (attempt - 1))
            raise AssertionError("unreachable")

        return wrapper

    return decorate


# ------------------------------------------------------ generators/iterators
def read_rows(path: Path) -> Iterator[dict[str, str]]:
    """Stream a CSV row by row (constant memory, even for huge files)."""
    with path.open(newline="", encoding="utf-8") as f:
        yield from csv.DictReader(f)


def batched(rows: Iterator[dict], size: int) -> Iterator[list[dict]]:
    batch: list[dict] = []
    for row in rows:
        batch.append(row)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch


class RollingMean:
    """Iterator protocol: yields the rolling mean of a numeric stream."""

    def __init__(self, values: Iterator[float], window: int):
        self._values, self._window, self._buf = iter(values), window, []

    def __iter__(self) -> "RollingMean":
        return self

    def __next__(self) -> float:
        self._buf.append(next(self._values))  # StopIteration propagates
        if len(self._buf) > self._window:
            self._buf.pop(0)
        return sum(self._buf) / len(self._buf)


@contextmanager
def stopwatch(label: str):
    start = time.perf_counter()
    yield
    print(f"{label}: {time.perf_counter() - start:.3f}s")


# ---------------------------------------------------------------- dataclasses
@dataclass(frozen=True, slots=True)
class Location:
    name: str
    latitude: float
    longitude: float


@dataclass
class DailyWeather:
    date: str
    t_max: float
    t_min: float
    rain_mm: float
    et0_mm: float
    tags: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.t_max >= 40:
            self.tags.append("heat-stress")
        if self.rain_mm >= 50:
            self.tags.append("heavy-rain")


# --------------------------------------------------------------- async I/O
def _get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "AgriSmart/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:  # noqa: S310
        return json.loads(r.read())


async def fetch_forecast(loc: Location, days: int = 3) -> list[DailyWeather]:
    params = urllib.parse.urlencode({
        "latitude": loc.latitude, "longitude": loc.longitude, "forecast_days": days, "timezone": "auto",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
    })
    data = await asyncio.to_thread(_get_json, f"https://api.open-meteo.com/v1/forecast?{params}")
    d = data["daily"]
    return [DailyWeather(*row) for row in zip(d["time"], d["temperature_2m_max"], d["temperature_2m_min"],
                                              d["precipitation_sum"], d["et0_fao_evapotranspiration"])]


async def fetch_many(locations: list[Location]) -> dict[str, list[DailyWeather]]:
    """Fetch several locations concurrently with asyncio.gather."""
    results = await asyncio.gather(*(fetch_forecast(loc) for loc in locations))
    return {loc.name: res for loc, res in zip(locations, results)}


if __name__ == "__main__":
    places = [Location("Ludhiana", 30.90, 75.85), Location("Nashik", 19.99, 73.79), Location("Guntur", 16.31, 80.44)]
    with stopwatch("3 forecasts concurrently"):
        forecasts = asyncio.run(fetch_many(places))
    for name, days in forecasts.items():
        print(name, [asdict(d) for d in days][:1])
