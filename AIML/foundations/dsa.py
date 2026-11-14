"""Data structures & algorithms applied to farm problems.

* Dijkstra (heap)        — cheapest route from a farm to a mandi (market) over a road graph
* 0/1 knapsack (DP)      — choose crops for limited land to maximise expected profit
* Binary search          — smallest irrigation volume that meets a soil-moisture target
* Top-k (heap)           — best-yielding districts without sorting everything
* Union-find             — group adjacent fields into contiguous blocks
* Sliding window         — longest dry spell in a rainfall series

    python -m AIML.foundations.dsa
"""

from __future__ import annotations

import heapq
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass


def dijkstra(graph: dict[str, dict[str, float]], source: str, target: str) -> tuple[float, list[str]]:
    """Shortest path with non-negative edge weights. O((V + E) log V)."""
    dist: dict[str, float] = {source: 0.0}
    prev: dict[str, str] = {}
    heap = [(0.0, source)]
    visited: set[str] = set()
    while heap:
        d, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        if node == target:
            break
        for nxt, w in graph.get(node, {}).items():
            if w < 0:
                raise ValueError("Dijkstra needs non-negative weights")
            nd = d + w
            if nd < dist.get(nxt, float("inf")):
                dist[nxt], prev[nxt] = nd, node
                heapq.heappush(heap, (nd, nxt))
    if target not in dist:
        return float("inf"), []
    path = [target]
    while path[-1] != source:
        path.append(prev[path[-1]])
    return dist[target], path[::-1]


@dataclass(frozen=True)
class CropOption:
    name: str
    area_ha: int  # land the option needs (integer hectares)
    profit: float  # expected profit for that area


def knapsack(options: Sequence[CropOption], land_ha: int) -> tuple[float, list[CropOption]]:
    """0/1 knapsack by dynamic programming. O(n · land)."""
    n = len(options)
    best = [[0.0] * (land_ha + 1) for _ in range(n + 1)]
    for i, opt in enumerate(options, start=1):
        for cap in range(land_ha + 1):
            best[i][cap] = best[i - 1][cap]
            if opt.area_ha <= cap:
                best[i][cap] = max(best[i][cap], best[i - 1][cap - opt.area_ha] + opt.profit)
    chosen, cap = [], land_ha
    for i in range(n, 0, -1):  # backtrack
        if best[i][cap] != best[i - 1][cap]:
            chosen.append(options[i - 1])
            cap -= options[i - 1].area_ha
    return best[n][land_ha], chosen[::-1]


def binary_search_min(lo: float, hi: float, ok: Callable[[float], bool], tol: float = 1e-3) -> float:
    """Smallest x in [lo, hi] with ok(x) True, for a monotone predicate."""
    if not ok(hi):
        raise ValueError("no solution in range")
    while hi - lo > tol:
        mid = (lo + hi) / 2
        if ok(mid):
            hi = mid
        else:
            lo = mid
    return hi


def top_k(items: Iterable[tuple[str, float]], k: int) -> list[tuple[str, float]]:
    """k largest by value using a size-k min-heap. O(n log k)."""
    heap: list[tuple[float, str]] = []
    for name, value in items:
        if len(heap) < k:
            heapq.heappush(heap, (value, name))
        elif value > heap[0][0]:
            heapq.heapreplace(heap, (value, name))
    return [(name, value) for value, name in sorted(heap, reverse=True)]


class UnionFind:
    """Disjoint sets with path compression and union by size."""

    def __init__(self, items: Iterable[str]):
        self.parent = {x: x for x in items}
        self.size = dict.fromkeys(self.parent, 1)

    def find(self, x: str) -> str:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: str, b: str) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]

    def groups(self) -> list[set[str]]:
        out: dict[str, set[str]] = {}
        for x in self.parent:
            out.setdefault(self.find(x), set()).add(x)
        return sorted(out.values(), key=len, reverse=True)


def longest_dry_spell(rain_mm: Sequence[float], threshold: float = 1.0) -> tuple[int, int]:
    """Longest run of days with rain < threshold. Returns (length, start_index). O(n)."""
    best_len = best_start = cur_len = 0
    for i, r in enumerate(rain_mm):
        cur_len = cur_len + 1 if r < threshold else 0
        if cur_len > best_len:
            best_len, best_start = cur_len, i - cur_len + 1
    return best_len, best_start


if __name__ == "__main__":
    roads = {"Farm": {"A": 4, "B": 2}, "B": {"A": 1, "Mandi": 7}, "A": {"Mandi": 3}}
    print("route:", dijkstra(roads, "Farm", "Mandi"))
    options = [CropOption("rice", 3, 180_000), CropOption("cotton", 4, 260_000), CropOption("maize", 2, 90_000)]
    print("plan:", knapsack(options, 6))
