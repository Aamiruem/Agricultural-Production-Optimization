"""Platform status for the operations dashboard and for monitoring.

* ``GET /api/system/status``  — this API instance + probes of the farm-service and MCP
  server, model versions, assistant runtime, caches and load metrics.
* ``GET /api/system/metrics`` — rolling request metrics of the worker that answered.
* ``GET /api/metrics``        — the same in Prometheus text format.

Behind the gateway each call can land on a different replica/worker; responses
carry ``instance`` (and the ``X-Served-By`` header) so the load balancing is visible.
"""

from __future__ import annotations

import asyncio
import platform
import time

import httpx
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import PlainTextResponse
from sqlalchemy import text

from app.api.deps import DbSession
from app.core.cache import all_stats
from app.core.config import get_settings
from app.core.resilience import INSTANCE_ID, metrics
from app.services.recommender import model_info
from app.services.warmup import warmup_state

router = APIRouter(tags=["system"])


async def _probe(client: httpx.AsyncClient, name: str, url: str) -> dict:
    start = time.perf_counter()
    try:
        res = await client.get(url)
        latency = round((time.perf_counter() - start) * 1000, 1)
        body = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
        state = "ok" if res.status_code == 200 and body.get("status", "ok") == "ok" else "degraded"
        return {
            "name": name,
            "url": url,
            "status": state,
            "http_status": res.status_code,
            "latency_ms": latency,
            "details": body,
        }
    except (httpx.HTTPError, ValueError) as exc:
        return {
            "name": name,
            "url": url,
            "status": "down",
            "http_status": None,
            "latency_ms": round((time.perf_counter() - start) * 1000, 1),
            "error": type(exc).__name__,
        }


def _assistant() -> dict:
    try:
        from app.ai.llm import get_llm

        llm = get_llm()
        return {"llm_available": llm.available, "model": get_settings().anthropic_model}
    except Exception as exc:  # optional AI deps missing on this host
        return {"llm_available": False, "error": type(exc).__name__}


def _yield_model() -> dict:
    try:
        from AIML.agentic_ai.tools import _bundle
        from AIML.config import YIELD_MODEL_PATH

        if not YIELD_MODEL_PATH.exists():
            return {"loaded": False}
        b = _bundle(str(YIELD_MODEL_PATH))
        return {"loaded": True, "model": b.get("name"), "trained_at": b.get("trained_at"), "metrics": b.get("metrics")}
    except Exception as exc:
        return {"loaded": False, "error": type(exc).__name__}


def _local_checks(db) -> tuple[str, dict, dict]:
    """Blocking work (DB round-trip, model loading on a cold worker, SDK imports) — run in the threadpool."""
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception:
        database = "unavailable"
    return database, {"crop": model_info(), "yield": _yield_model()}, _assistant()


@router.get("/system/status")
async def system_status(db: DbSession):
    s = get_settings()
    # Never block the event loop: a cold worker would stall every request it serves.
    local = run_in_threadpool(_local_checks, db)
    async with httpx.AsyncClient(timeout=s.service_probe_timeout_s) as client:
        (database, models, assistant), farm, mcp = await asyncio.gather(
            local,
            _probe(client, "farm-service", f"{s.farm_service_url.rstrip('/')}/health"),
            _probe(client, "mcp", f"{s.mcp_url.rstrip('/')}/health"),
        )
    api = {
        "name": "api",
        "status": "ok" if database == "ok" else "degraded",
        "instance": INSTANCE_ID,
        "latency_ms": 0.0,
        "details": {"database": database},
    }
    services = [api, farm, mcp]
    overall = (
        "ok" if all(x["status"] == "ok" for x in services) else ("degraded" if api["status"] != "down" else "down")
    )
    return {
        "status": overall,
        "checked_at": time.time(),
        "instance": INSTANCE_ID,
        "environment": s.environment,
        "runtime": {"python": platform.python_version(), "platform": platform.system()},
        "services": services,
        "models": models,
        "assistant": assistant,
        "warmup": warmup_state(),
        "caches": all_stats(),
        "load": {**metrics.snapshot(), "max_concurrency": s.max_concurrency},
        "queue": {"broker": "redis" if s.redis_url else "in-process (eager)"},
    }


@router.get("/system/metrics")
def system_metrics():
    return {**metrics.snapshot(), "max_concurrency": get_settings().max_concurrency, "caches": all_stats()}


@router.get("/metrics", response_class=PlainTextResponse, include_in_schema=False)
def prometheus_metrics():
    extra = {}
    for c in all_stats():
        extra[f"cache_{c['name']}_hit_rate"] = c["hit_rate"]
        extra[f"cache_{c['name']}_size"] = c["size"]
    return metrics.prometheus(extra)
