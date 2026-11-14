"""Keep the API responsive under heavy load.

* ``LoadShedMiddleware`` caps in-flight HTTP requests per worker process. Past the
  cap it answers ``503 Service Unavailable`` + ``Retry-After`` immediately instead
  of queueing work until every request times out. The gateway (Nginx) retries
  idempotent requests on another replica, and the dashboard client backs off.
* ``Metrics`` keeps rolling request statistics (throughput, latency percentiles,
  status codes, per-route counts, shed requests) for ``/api/system/metrics`` and
  the Prometheus endpoint ``/api/metrics``.

Pure ASGI (no BaseHTTPMiddleware) so it adds no per-request task overhead and
never buffers streaming responses (Server-Sent Events).
"""

from __future__ import annotations

import json
import os
import socket
import time
from collections import Counter, deque

INSTANCE_ID = f"{socket.gethostname()}:{os.getpid()}"


class Metrics:
    """Per-process rolling request metrics. Mutated only on the event loop thread."""

    def __init__(self, window: int = 4096):
        self.started = time.time()
        self.total = 0
        self.rejected = 0
        self.in_flight = 0
        self.peak_in_flight = 0
        self.status = Counter()
        self.routes = Counter()
        self.latencies_ms: deque[float] = deque(maxlen=window)
        self.finished_at: deque[float] = deque(maxlen=window)

    def record(self, route: str, status: int, elapsed_ms: float) -> None:
        self.total += 1
        self.status[f"{status // 100}xx"] += 1
        self.routes[route] += 1
        self.latencies_ms.append(elapsed_ms)
        self.finished_at.append(time.time())

    @staticmethod
    def _pct(sorted_values: list[float], q: float) -> float:
        if not sorted_values:
            return 0.0
        idx = min(len(sorted_values) - 1, max(0, round(q * (len(sorted_values) - 1))))
        return round(sorted_values[idx], 2)

    def snapshot(self) -> dict:
        now = time.time()
        lat = sorted(self.latencies_ms)
        recent = sum(1 for t in self.finished_at if now - t <= 60)
        return {
            "instance": INSTANCE_ID,
            "uptime_s": round(now - self.started, 1),
            "requests_total": self.total,
            "requests_per_s_1m": round(recent / 60, 3),
            "in_flight": self.in_flight,
            "peak_in_flight": self.peak_in_flight,
            "rejected_total": self.rejected,
            "status": dict(self.status),
            "latency_ms": {
                "p50": self._pct(lat, 0.5),
                "p95": self._pct(lat, 0.95),
                "p99": self._pct(lat, 0.99),
                "samples": len(lat),
            },
            "top_routes": [{"route": r, "count": c} for r, c in self.routes.most_common(12)],
        }

    def prometheus(self, extra: dict[str, float] | None = None) -> str:
        snap = self.snapshot()
        label = f'instance="{INSTANCE_ID}"'
        lines = [
            "# TYPE agrismart_requests_total counter",
            f"agrismart_requests_total{{{label}}} {snap['requests_total']}",
            "# TYPE agrismart_requests_rejected_total counter",
            f"agrismart_requests_rejected_total{{{label}}} {snap['rejected_total']}",
            "# TYPE agrismart_requests_in_flight gauge",
            f"agrismart_requests_in_flight{{{label}}} {snap['in_flight']}",
            "# TYPE agrismart_request_latency_ms summary",
        ]
        for q in ("p50", "p95", "p99"):
            lines.append(f'agrismart_request_latency_ms{{{label},quantile="0.{q[1:]}"}} {snap["latency_ms"][q]}')
        lines.append("# TYPE agrismart_responses_total counter")
        for cls, n in sorted(snap["status"].items()):
            lines.append(f'agrismart_responses_total{{{label},class="{cls}"}} {n}')
        for name, value in (extra or {}).items():
            lines += [f"# TYPE agrismart_{name} gauge", f"agrismart_{name}{{{label}}} {value}"]
        return "\n".join(lines) + "\n"


metrics = Metrics()

_EXEMPT = ("/api/health", "/api/metrics", "/api/system/")


class LoadShedMiddleware:
    """Reject excess concurrent requests fast (503 + Retry-After) and record metrics."""

    def __init__(self, app, max_concurrency: int = 64, retry_after_s: int = 1, registry: Metrics = metrics):
        self.app = app
        self.max_concurrency = max_concurrency
        self.retry_after = str(retry_after_s)
        self.metrics = registry

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path: str = scope.get("path", "")
        exempt = path.startswith(_EXEMPT)  # health checks must answer even when saturated
        m = self.metrics
        if not exempt and self.max_concurrency > 0 and m.in_flight >= self.max_concurrency:
            m.rejected += 1
            m.record("shed", 503, 0.0)
            await self._reject(send)
            return

        m.in_flight += 1
        m.peak_in_flight = max(m.peak_in_flight, m.in_flight)
        status_holder = {"code": 500}
        start = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_holder["code"] = message["status"]
                headers = list(message.get("headers", []))
                headers.append((b"x-served-by", INSTANCE_ID.encode()))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            m.in_flight -= 1
            route = scope.get("route")
            template = getattr(route, "path", None)
            if template and path.startswith("/api/") and not template.startswith("/api"):
                template = "/api" + template  # routers are included with prefix="/api"
            label = template or ("unmatched" if status_holder["code"] == 404 else path[:64])
            m.record(
                f"{scope.get('method', 'GET')} {label}", status_holder["code"], (time.perf_counter() - start) * 1000
            )

    async def _reject(self, send) -> None:
        body = json.dumps({"detail": "Server is busy, please retry shortly.", "retry_after_s": int(self.retry_after)})
        await send(
            {
                "type": "http.response.start",
                "status": 503,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"retry-after", self.retry_after.encode()),
                    (b"x-served-by", INSTANCE_ID.encode()),
                    (b"cache-control", b"no-store"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body.encode()})
