"""Load shedding, prediction caching, SHAP explanations and the platform status API."""

import asyncio

import joblib
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

from app.core.cache import TTLCache, get_cache
from app.core.config import get_settings
from app.core.resilience import LoadShedMiddleware, Metrics
from app.data.crops import CROPS, FEATURES
from app.services import recommender

SOIL = {"N": 90, "P": 42, "K": 43, "temperature": 20.8, "humidity": 82, "ph": 6.5, "rainfall": 202}


@pytest.fixture
def forest_bundle(tmp_path, monkeypatch):
    """Serve a small Random Forest so TreeSHAP has a real tree model to explain."""
    classes = sorted(CROPS)
    X = pd.DataFrame([CROPS[c].features() for c in classes] * 4, columns=FEATURES)
    X = X * pd.Series([1.0, 1.01, 0.99, 1.02] * len(classes)).repeat(1).values[: len(X), None]
    y = list(range(len(classes))) * 4
    model = Pipeline([("clf", RandomForestClassifier(n_estimators=25, random_state=0))]).fit(X, y)
    path = tmp_path / "forest.joblib"
    joblib.dump(
        {
            "model": model,
            "classes": classes,
            "features": FEATURES,
            "name": "random_forest",
            "metrics": {},
            "trained_at": None,
        },
        path,
    )
    monkeypatch.setattr(get_settings(), "model_path", path)
    recommender.reload_model()
    yield
    monkeypatch.undo()
    recommender.reload_model()


def test_status_reports_every_service_even_when_siblings_are_down(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "farm_service_url", "http://127.0.0.1:9")  # nothing listens on port 9
    monkeypatch.setattr(get_settings(), "mcp_url", "http://127.0.0.1:9")
    monkeypatch.setattr(get_settings(), "service_probe_timeout_s", 0.5)
    res = client.get("/api/system/status")
    assert res.status_code == 200
    body = res.json()
    by_name = {s["name"]: s for s in body["services"]}
    assert by_name["api"]["status"] == "ok"
    assert by_name["farm-service"]["status"] == "down" and by_name["mcp"]["status"] == "down"
    assert body["status"] == "degraded"
    assert body["models"]["crop"]["method"] in {"ml-model", "profile-similarity"}
    assert "x-served-by" in res.headers


def test_metrics_count_requests_by_route_template(client):
    client.get("/api/crops/rice")
    snap = client.get("/api/system/metrics").json()
    assert snap["requests_total"] >= 1
    assert any(r["route"] == "GET /api/crops/{name}" for r in snap["top_routes"])
    prom = client.get("/api/metrics").text
    assert "agrismart_requests_total" in prom and "agrismart_request_latency_ms" in prom


def test_explain_requires_a_trained_model(client):
    assert client.post("/api/ml/explain", json=SOIL).status_code == 503


def test_explain_returns_additive_shap_contributions(client, forest_bundle):
    body = client.post("/api/ml/explain?top=2", json=SOIL).json()
    assert len(body["explanations"]) == 2
    best = body["explanations"][0]
    assert best["crop"] == client.post("/api/recommend/crop", json=SOIL).json()["top"][0]["crop"]
    assert {c["feature"] for c in best["contributions"]} == set(FEATURES)
    if body["method"] == "TreeSHAP":
        assert (
            abs(best["base_value"] + sum(c["contribution"] for c in best["contributions"]) - best["probability"]) < 1e-3
        )


def test_repeated_recommendations_are_served_from_cache(client):
    cache = get_cache("crop_recommendation")
    cache.clear()
    hits = cache.hits
    first = client.post("/api/recommend/crop", json=SOIL).json()
    second = client.post("/api/recommend/crop", json=SOIL).json()
    assert first == second and cache.hits == hits + 1


def test_ttl_cache_expires_and_evicts():
    cache = TTLCache("t", maxsize=2, ttl_s=0)
    calls = []
    cache.get_or_compute("a", lambda: calls.append(1) or 1)
    cache.get_or_compute("a", lambda: calls.append(1) or 1)  # ttl 0: already expired
    assert len(calls) == 2
    lru = TTLCache("lru", maxsize=2, ttl_s=60)
    for k in "abc":
        lru.get_or_compute(k, lambda: k)
    assert lru.stats()["size"] == 2


def test_load_shedding_rejects_past_the_concurrency_cap():
    gate = asyncio.Event()

    async def slow_app(scope, receive, send):
        await gate.wait()
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"ok"})

    registry = Metrics()
    mw = LoadShedMiddleware(slow_app, max_concurrency=2, registry=registry)

    async def call(path="/api/recommend/crop"):
        sent = []

        async def send(message):
            sent.append(message)

        await mw({"type": "http", "path": path, "method": "POST", "headers": []}, None, send)
        return sent[0]["status"], dict(sent[0]["headers"])

    async def scenario():
        running = [asyncio.create_task(call()) for _ in range(2)]
        await asyncio.sleep(0.01)
        shed_status, shed_headers = await call()
        health_task = asyncio.create_task(call("/api/health"))  # health checks are exempt from the cap
        await asyncio.sleep(0.01)
        gate.set()
        done = await asyncio.gather(*running, health_task)
        return shed_status, shed_headers, [d[0] for d in done]

    shed_status, shed_headers, statuses = asyncio.run(scenario())
    assert shed_status == 503 and shed_headers[b"retry-after"] == b"1"
    assert statuses == [200, 200, 200]
    assert registry.rejected == 1 and registry.in_flight == 0 and registry.peak_in_flight == 3


def test_warmup_runs_every_step_and_records_failures(monkeypatch):
    from app.services import warmup

    monkeypatch.setattr(warmup, "_state", {"status": "pending", "steps": {}, "seconds": None})
    monkeypatch.setattr(warmup, "STEPS", {"ok": lambda: True, "absent": lambda: False, "boom": lambda: 1 / 0})
    warmup._run()
    state = warmup.warmup_state()
    assert state["status"] == "done"
    assert state["steps"] == {"ok": "ready", "absent": "skipped", "boom": "failed: ZeroDivisionError"}


def test_status_reports_warmup(client):
    assert client.get("/api/system/status").json()["warmup"]["status"] in {"pending", "running", "done"}
