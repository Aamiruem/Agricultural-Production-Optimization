"""Local agriculture intelligence: matching parity, data quality, boundaries and endpoints.

External APIs are replaced with recorded-shape stubs here so tests are deterministic; the
live-API check is scripts/check_local_intel_live.py (run manually, results in docs).
"""

import json
from datetime import date
from pathlib import Path

import pytest
from app.services.local import datasets, http, matching, providers

ROOT = Path(__file__).resolve().parents[3]
CASES = json.loads((ROOT / "shared" / "local-intel" / "matching_cases.json").read_text(encoding="utf-8"))["cases"]


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_matching_matches_hand_computed_cases(case):
    res = matching.compare_profiles(case["profile"], case["local"], now=date.fromisoformat(case["now"]))
    assert res["score"] == pytest.approx(case["expected"]["score"], abs=0.05)
    assert res["coverage"] == pytest.approx(case["expected"]["coverage"], abs=0.05)
    rows = {r["key"]: r for r in res["rows"]}
    for k, st in case["expected"]["status"].items():
        assert rows[k]["status"] == st, k
    for k, sim in case["expected"]["similarity"].items():
        assert rows[k]["similarity"] == pytest.approx(sim, abs=0.005), k
    assert res["confidence"]["temporal"]["level"] == case["expected"]["temporal"]
    assert "not the accuracy" in res["disclaimer"]


def test_missing_values_are_never_matches():
    res = matching.compare_profiles(
        {"state": "Goa", "crops": [], "seasons": []}, {"state": "Goa", "crops": [], "levels": {}}
    )
    assert res["score"] == 60
    assert len(res["missing"]) > 8


def test_aggregate_area_not_comparable():
    res = matching.compare_profiles(
        {"state": "Punjab", "area": 5750}, {"state": "Punjab", "area": 2}, not_comparable={"area": "state total"}
    )
    assert next(r for r in res["rows"] if r["key"] == "area")["status"] == "not comparable"


def test_schema_detection_on_real_datasets():
    y = datasets.load_builtin("crop_yield")
    assert y["schema"]["mapping"]["rainfall"] == "Annual_Rainfall"
    assert y["schema"]["hasLocation"] and not y["schema"]["hasCoordinates"]
    d = datasets.load_builtin("crop_data")
    assert d["schema"]["mapping"]["crop"] == "label"
    assert not d["schema"]["hasLocation"]


def test_quality_matches_browser_implementation():
    q = matching.validate_dataset(datasets.load_builtin("crop_yield")["rows"], now=date(2026, 11, 14))
    assert q["rows"] == 19689
    # Same algorithm and data as the browser (which reported 90.9% on 2026-11-14).
    assert q["score"] == pytest.approx(90.9, abs=0.05)


def test_quality_flags_problems():
    rows = [
        {
            "state": "Punjab",
            "crop": "Wheat",
            "season": "Rabi",
            "year": 2020,
            "area": 100,
            "production": 500,
            "yield": 5,
            "ph": 7,
        },
        {
            "state": "Punjab",
            "crop": "Wheat",
            "season": "Rabi",
            "year": 2020,
            "area": 100,
            "production": 500,
            "yield": 5,
            "ph": 7,
        },
        {
            "state": "Punjab",
            "crop": "Wheat",
            "season": "Rabi",
            "year": 2020,
            "area": 100,
            "production": 900,
            "yield": 5,
            "ph": 14,
        },
        {
            "state": "Punjab",
            "crop": "Rice",
            "season": "Kharif",
            "year": 2020,
            "area": 100,
            "production": None,
            "yield": None,
            "ph": None,
        },
    ]
    q = matching.validate_dataset(rows, now=date(2026, 11, 14))
    assert (q["duplicates"], q["conflicts"], q["invalid"], q["inconsistent"]) == (1, 3, 1, 1)


def test_boundary_lookup_uses_real_files():
    a = providers.admin_lookup(30.8, 75.7)
    assert a["state"] == "Punjab" and a["district"] == "Ludhiana"
    assert a["subdistrict"]
    assert providers.admin_lookup(51.5, -0.1)["inIndia"] is False


@pytest.fixture
def stub_http(monkeypatch):
    calls = []

    def fake(url, params=None, timeout=None):
        calls.append(url)
        if "nominatim" in url and url.endswith("/search"):
            return [
                {
                    "lat": "30.84",
                    "lon": "75.98",
                    "name": "Sahnewal",
                    "display_name": "Sahnewal, Ludhiana, Punjab, India",
                    "addresstype": "town",
                    "address": {
                        "town": "Sahnewal",
                        "county": "Ludhiana (East) Tahsil",
                        "state_district": "Ludhiana",
                        "state": "Punjab",
                    },
                }
            ]
        if "nominatim" in url:
            return {
                "lat": "30.8",
                "lon": "75.7",
                "display_name": "Dhaipai, Punjab",
                "address": {"village": "Dhaipai", "state": "Punjab"},
            }
        if "rest.isric.org" in url:
            lat = dict(params)["lat"]
            empty = {
                "properties": {"layers": [{"name": "phh2o", "depths": [{"label": "0-5cm", "values": {"mean": None}}]}]}
            }
            full = {
                "properties": {"layers": [{"name": "phh2o", "depths": [{"label": "0-5cm", "values": {"mean": 78}}]}]}
            }
            return empty if lat == "30.80000" else full  # the point itself is "masked"
        if "open-meteo" in url:
            return {"current": {"temperature_2m": 22.7}, "daily": {"time": ["2026-11-14"]}}
        raise AssertionError(url)

    monkeypatch.setattr(providers, "get_json", fake)
    return calls


def test_search_and_reverse_endpoints(client, stub_http):
    r = client.get("/api/location/search", params={"q": "Sahnewal"})
    assert r.status_code == 200
    assert r.json()["results"][0]["district"] == "Ludhiana"
    r = client.get("/api/location/reverse-geocode", params={"lat": 30.8, "lon": 75.7})
    assert r.json()["place"]["village"] == "Dhaipai"
    assert client.get("/api/location/search", params={"q": "ab"}).status_code == 422


def test_soil_falls_back_to_nearby_cell_and_says_so(client, stub_http):
    r = client.get("/api/soil/local", params={"lat": 30.8, "lon": 75.7}).json()
    assert r["json"] is not None
    assert r["sample"] != [30.8, 75.7]  # sampled ~2 km away, reported to the client


def test_forecast_endpoint(client, stub_http):
    r = client.get("/api/weather/forecast", params={"lat": 30.8, "lon": 75.7}).json()
    assert r["current"]["temperature_2m"] == 22.7
    assert r["source"] == "openMeteoForecast"


def test_upstream_errors_are_reported_not_faked(client, monkeypatch):
    def boom(*a, **k):
        raise http.UpstreamError("rest.isric.org did not respond in time", 504)

    monkeypatch.setattr(providers, "get_json", boom)
    r = client.get("/api/soil/local", params={"lat": 30.8, "lon": 75.7})
    assert r.status_code == 504
    assert "did not respond" in r.json()["detail"]


def test_market_prices_need_a_key(client, monkeypatch):
    monkeypatch.setattr(providers.get_settings(), "data_gov_in_api_key", None)
    r = client.get("/api/agriculture/market-prices", params={"state": "Punjab"})
    assert r.status_code == 503
    assert "DATA_GOV_IN_API_KEY" in r.json()["detail"]


def test_compare_and_validate_endpoints(client):
    local = {
        "lat": 30.8,
        "lon": 75.7,
        "state": "Punjab",
        "district": "Ludhiana",
        "rainfall": 781,
        "crops": ["Wheat", "Rice"],
        "season": "Rabi",
        "area": 2.02,
        "levels": {"rainfall": 4},
    }
    r = client.post("/api/agriculture/compare-dataset", json={"dataset": "crop_yield", "local": local}).json()
    assert r["matchLevel"] == "state" and r["matchedRecords"] > 100
    statuses = {row["key"]: row["status"] for row in r["comparison"]["rows"]}
    assert statuses["area"] == "not comparable"
    assert statuses["temperature"] == "missing"  # the dataset has no temperature column
    r = client.post("/api/agriculture/compare-dataset", json={"dataset": "crop_data", "local": local}).json()
    assert r["noLocation"] is True
    q = client.post("/api/agriculture/validate-data", json={"dataset": "crop_yield"}).json()
    assert q["rows"] == 19689 and q["score"] > 50


def test_agriculture_local_endpoint(client):
    r = client.get("/api/agriculture/local", params={"state": "Punjab"}).json()
    assert r["resolution"] == "state"
    assert any(c["crop"] == "Wheat" for c in r["crops"])
    assert client.get("/api/agriculture/local", params={"state": "Atlantis"}).status_code == 404
