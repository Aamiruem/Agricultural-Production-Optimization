"""Fast unit tests for the AIML modules (no network, no GPU, small inputs)."""
import asyncio
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from AIML.foundations import dsa, linear_algebra, optimization


# --------------------------------------------------------------- foundations
def test_dijkstra_and_knapsack():
    roads = {"Farm": {"A": 4, "B": 2}, "B": {"A": 1, "Mandi": 7}, "A": {"Mandi": 3}}
    assert dsa.dijkstra(roads, "Farm", "Mandi") == (6, ["Farm", "B", "A", "Mandi"])
    assert dsa.dijkstra(roads, "Mandi", "Farm") == (float("inf"), [])
    opts = [dsa.CropOption("rice", 3, 180), dsa.CropOption("cotton", 4, 260), dsa.CropOption("maize", 2, 90)]
    best, chosen = dsa.knapsack(opts, 6)
    assert best == 350 and [c.name for c in chosen] == ["cotton", "maize"]


def test_search_heap_unionfind_window():
    assert dsa.binary_search_min(0, 100, lambda x: x * x >= 50) == pytest.approx(7.071, abs=1e-2)
    assert dsa.top_k([("a", 1), ("b", 5), ("c", 3), ("d", 4)], 2) == [("b", 5), ("d", 4)]
    uf = dsa.UnionFind("ABCDE")
    uf.union("A", "B")
    uf.union("B", "C")
    assert uf.groups()[0] == {"A", "B", "C"}
    assert dsa.longest_dry_spell([5, 0, 0, 0, 2, 0, 0]) == (3, 1)


def test_linear_algebra_matches_numpy():
    a, b = [[1, 2], [3, 4]], [[5, 6], [7, 8]]
    assert linear_algebra.matmul(a, b) == (np.array(a) @ np.array(b)).tolist()
    rng = np.random.default_rng(0)
    X = rng.normal(size=(100, 3))
    y = X @ [1.5, -2, 0.5] + 3
    assert np.allclose(linear_algebra.normal_equation(X, y), [3, 1.5, -2, 0.5])
    A = np.cov(X, rowvar=False)
    lam, v = linear_algebra.power_iteration(A)
    assert lam == pytest.approx(np.linalg.eigvalsh(A)[-1], rel=1e-6)
    _, _, ratio = linear_algebra.pca(X, 2)
    assert ratio.sum() <= 1 and ratio[0] >= ratio[1]


def test_optimisers_converge_and_gradient_is_correct():
    rng = np.random.default_rng(1)
    X = np.column_stack([np.ones(50), rng.normal(size=(50, 2))])
    y = X @ [1.0, 2.0, -1.0]
    w0 = rng.normal(size=3)
    analytic = optimization.mse_loss_and_grad(w0, X, y)[1]
    numeric = optimization.numerical_grad(lambda w: optimization.mse_loss_and_grad(w, X, y)[0], w0)
    assert np.allclose(analytic, numeric, atol=1e-5)
    for method in ("gd", "momentum", "adam"):
        w, _ = optimization.optimise(X, y, method, lr=0.01 if method == "momentum" else 0.05)
        assert np.allclose(w, [1, 2, -1], atol=1e-2), method


# --------------------------------------------------------------- python adv.
def test_python_toolkit(tmp_path):
    from AIML.pyadvanced.toolkit import DailyWeather, RollingMean, batched, read_rows, retry

    calls = {"n": 0}

    @retry(times=3, delay=0)
    def flaky():
        calls["n"] += 1
        if calls["n"] < 3:
            raise ConnectionError
        return "ok"

    assert flaky() == "ok" and calls["n"] == 3
    p = tmp_path / "x.csv"
    p.write_text("a\n1\n2\n3\n")
    assert [len(b) for b in batched(read_rows(p), 2)] == [2, 1]
    assert list(RollingMean(iter([2, 4, 6]), 2)) == [2, 3, 5]
    assert DailyWeather("d", 41, 25, 60, 5).tags == ["heat-stress", "heavy-rain"]


# --------------------------------------------------------------- deep learning
def test_numpy_nn_backprop_matches_numerical_gradient():
    from AIML.deep_learning.numpy_nn import MLP, gradient_check, train

    rng = np.random.default_rng(0)
    X = rng.normal(size=(120, 4))
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    net = MLP([4, 16, 2], l2=0.0)
    assert gradient_check(net, X[:20], y[:20]) < 1e-5
    train(net, X[:90], y[:90], X[90:], y[90:], epochs=100, lr=0.1)
    assert (net.predict(X[90:]) == y[90:]).mean() > 0.85


def test_attention_properties():
    from AIML.deep_learning.attention import causal_mask, multi_head_attention, scaled_dot_product_attention

    rng = np.random.default_rng(0)
    Q, K, V = rng.normal(size=(5, 8)), rng.normal(size=(5, 8)), rng.normal(size=(5, 8))
    out, w = scaled_dot_product_attention(Q, K, V, causal_mask(5))
    assert np.allclose(w.sum(-1), 1) and np.allclose(np.triu(w, 1), 0)  # rows sum to 1; no peeking ahead
    assert np.allclose(out[0], V[0])  # first position can only attend to itself
    W = [rng.normal(size=(8, 8)) for _ in range(4)]
    assert multi_head_attention(rng.normal(size=(6, 8)), *W, heads=2).shape == (6, 8)


def test_sequence_windows():
    from AIML.deep_learning.sequence_models import make_windows

    X, y = make_windows(np.arange(20, dtype=float).reshape(10, 2), target_idx=1, window=3, horizon=2)
    assert X.shape == (6, 3, 2) and y.shape == (6, 2)
    assert y[0].tolist() == [7, 9]  # target column of rows 3 and 4


# ------------------------------------------------------------------ data/ML
def test_yield_cleaning_drops_bad_rows_and_builds_features():
    from AIML.preprocessing.yield_features import clean

    raw = pd.DataFrame({"Crop": ["Rice ", "Coconut ", "Wheat", "Rice"], "Crop_Year": [2000] * 4,
                        "Season": ["Kharif  ", "Whole Year", "Rabi", "Kharif"], "State": ["Punjab"] * 4,
                        "Area": [100.0, 50.0, 0.0, 10.0], "Production": [300, 1000, 0, 20],
                        "Annual_Rainfall": [600.0] * 4, "Fertilizer": [15000.0, 0, 0, 1500.0],
                        "Pesticide": [30.0, 0, 0, 3.0], "Yield": [3.0, 20.0, 0.0, 2.0]})
    out = clean(raw)
    assert out["Crop"].tolist() == ["Rice", "Rice"] and out["Season"].iloc[0] == "Kharif"
    assert out["fertilizer_kg_ha"].iloc[0] == 150


def test_polars_weather_transform():
    from AIML.data_engineering.etl import transform_weather

    raw = pd.DataFrame({"date": pd.date_range("2024-01-30", periods=4), "precipitation_sum": [1.0, 2.0, 3.0, 4.0],
                        "et0_fao_evapotranspiration": [1.0] * 4, "temperature_2m_max": [20.0, 41.0, 30.0, 42.0]})
    out = transform_weather(raw).rows(named=True)
    assert [(r["month"], r["rain_mm"], r["heat_days"]) for r in out] == [(1, 3.0, 1), (2, 7.0, 1)]


# ------------------------------------------------------------------------ NLP
def test_preprocess_and_sentiment():
    from AIML.nlp.preprocess import preprocess
    from AIML.nlp.sentiment import lexicon_sentiment

    assert preprocess("Kitna yuria daalna hai gehu mein?") == ["kitna", "urea", "appli", "wheat"]
    assert lexicon_sentiment("yield was very good")["label"] == "positive"
    assert lexicon_sentiment("yield was not good")["label"] == "negative"


def test_intent_classifier_learns_seed_set():
    from AIML.nlp.intent_classifier import DATA, candidates

    df = pd.read_csv(DATA)
    model = candidates()["logistic_regression"].fit(df["text"], df["intent"])
    assert model.predict(["aphids attacking my mustard crop", "MSP for wheat this year"]).tolist() == [
        "pest_disease", "market_price"]


def test_word2vec_trains():
    from AIML.nlp.word2vec import Word2Vec

    sents = [["urea", "nitrogen", "fertilizer"], ["dap", "phosphorus", "fertilizer"], ["urea", "dap", "fertilizer"]] * 20
    model = Word2Vec(sents, dim=10, window=2, min_count=1)
    losses = model.train(epochs=5)
    assert losses[-1] < losses[0] and model.most_similar("urea")


# ------------------------------------------------------------------------ RAG
def test_rag_chunkers_and_retrieval():
    from AIML.rag.pipeline import BM25, Retriever, chunk_by_heading, chunk_fixed, chunk_recursive, load_docs, rrf

    docs = load_docs()
    for chunker in (chunk_fixed, chunk_recursive, chunk_by_heading):
        assert len(chunker(docs)) > 10
    chunks = chunk_by_heading(docs)
    bm25 = BM25(chunks).scores("urea nitrogen")
    ranked = list(np.argsort(-bm25))
    assert chunks[ranked[0]].source == "fertilizers-india"
    urea_content = next(i for i, c in enumerate(chunks) if c.source == "fertilizers-india" and "46%" in c.text)
    assert urea_content in ranked[:5]  # the nutrient-content table is among the best keyword hits
    hits = Retriever(chunks).search("How are sodic soils reclaimed?", k=3, rerank=True)
    assert hits[0].source == "soil-ph"
    assert rrf([np.array([3.0, 2, 1]), np.array([1.0, 2, 3])]).round(6).tolist() == [
        round(1 / 61 + 1 / 63, 6), round(2 / 62, 6), round(1 / 63 + 1 / 61, 6)]


# ----------------------------------------------------------------- big data
def test_hadoop_mapper_reducer_streaming():
    here = Path(__file__).parents[1] / "big_data" / "hadoop"
    csv = ("Crop,Crop_Year,Season,State,Area,Production,Annual_Rainfall,Fertilizer,Pesticide,Yield\n"
           "Wheat,2000,Rabi,Punjab,100,400,600,1,1,4\nWheat,2001,Rabi,Punjab,100,500,600,1,1,5\n"
           "Coconut ,2000,Whole Year,Kerala,10,90000,3000,1,1,9000\nbad,line\n")
    mapped = subprocess.run([sys.executable, here / "mapper.py"], input=csv, capture_output=True, text=True).stdout
    out = subprocess.run([sys.executable, here / "reducer.py"], input="".join(sorted(mapped.splitlines(True))),
                         capture_output=True, text=True).stdout
    assert out.strip() == "Punjab|Wheat\t900\t200\t4.500"


# ----------------------------------------------------------------------- CV
def test_leaf_analysis_finds_lesions_on_synthetic_leaf():
    import cv2

    from AIML.computer_vision.leaf_analysis import analyse

    img = np.full((400, 600, 3), 255, np.uint8)  # synthetic test image (white background)
    cv2.ellipse(img, (300, 200), (220, 120), 0, 0, 360, (40, 160, 40), -1)  # green leaf (BGR)
    healthy, _ = analyse(img.copy())
    for x in (220, 300, 380):
        cv2.circle(img, (x, 200), 25, (30, 110, 160), -1)  # brown spots
    sick, _ = analyse(img)
    assert healthy.severity == "healthy" and healthy.leaf_coverage_pct > 20
    assert sick.lesion_count == 3 and sick.lesion_pct > 2 and sick.severity in {"mild", "moderate"}


# ------------------------------------------------------------------- agents
def test_supervisor_routes_and_extracts_numbers():
    from AIML.agentic_ai.multi_agent import extract, run_plain, supervisor

    assert extract("Soil N 20 P 10 K 40, rice on 2 ha") == {"N": 20, "P": 10, "K": 40, "area_ha": 2, "crop": "rice"}
    assert supervisor({"question": "Soil N 20 P 10 K 40 for rice"})["route"] == "nutrient"
    state = run_plain("Soil N 20 P 10 K 40, rice on 2 ha", approve=True)
    assert "DAP 165.2 kg" in state["answer"]
    big = run_plain("Soil N 0 P 0 K 0, sugarcane on 5 ha", approve=False)
    assert big["needs_approval"] and "not approved" in big["answer"]


def test_mcp_server_exposes_tools():
    from AIML.agentic_ai.mcp_server import mcp

    names = {t.name for t in asyncio.run(mcp.list_tools())}
    assert names == {"recommend_crop", "explain_crop", "predict_yield", "fertilizer_plan", "weather_forecast",
                     "search_knowledge"}


MCP_HEADERS = {"Accept": "application/json, text/event-stream", "Content-Type": "application/json"}


def test_mcp_http_transport_is_stateless_and_serves_tools():
    """Two independent requests with no session id both succeed: safe behind a round-robin load balancer."""
    pytest.importorskip("starlette")
    from starlette.testclient import TestClient

    from AIML.agentic_ai.mcp_server import create_http_app

    with TestClient(create_http_app()) as http:
        assert http.get("/health").json()["status"] == "ok"
        listed = http.post("/mcp", headers=MCP_HEADERS, json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
        assert listed.status_code == 200 and "mcp-session-id" not in listed.headers
        assert {t["name"] for t in listed.json()["result"]["tools"]} >= {"recommend_crop", "explain_crop"}
        call = http.post("/mcp", headers=MCP_HEADERS, json={
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {"name": "fertilizer_plan", "arguments": {"crop": "rice", "N": 20, "P": 10, "K": 40, "area_ha": 2}}})
        assert call.status_code == 200 and "DAP" in call.text


def test_explain_crop_attributions_are_consistent():
    from AIML.agentic_ai.tools import explain_crop, recommend_crop

    soil = dict(N=90, P=42, K=43, temperature=20.8, humidity=82, ph=6.5, rainfall=202)
    out = explain_crop(**soil, top=2)
    assert out["explanations"][0]["crop"] == recommend_crop(**soil)["top"][0]["crop"]
    best = out["explanations"][0]
    assert {c["feature"] for c in best["contributions"]} == set(soil)
    if out["method"] == "TreeSHAP":  # SHAP is additive: base + contributions == predicted probability
        total = best["base_value"] + sum(c["contribution"] for c in best["contributions"])
        assert abs(total - best["probability"]) < 1e-3
