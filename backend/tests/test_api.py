from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

RICE_LIKE_SOIL = {
    "N": 85, "P": 45, "K": 40, "temperature": 23.5,
    "humidity": 82, "ph": 6.5, "rainfall": 230,
}


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_list_crops_and_filter_by_season():
    all_crops = client.get("/api/crops").json()
    assert len(all_crops) == 22
    rabi = client.get("/api/crops", params={"season": "rabi"}).json()
    assert rabi and all(c["season"] == "rabi" for c in rabi)


def test_get_unknown_crop_is_404():
    assert client.get("/api/crops/banana").status_code == 200
    assert client.get("/api/crops/unobtainium").status_code == 404


def test_recommend_crop_ranks_rice_first_for_wet_paddy_conditions():
    res = client.post("/api/recommend/crop", json=RICE_LIKE_SOIL)
    assert res.status_code == 200
    body = res.json()
    assert body["top"][0]["crop"] == "rice"
    assert len(body["top"]) == 3
    confidences = [t["confidence"] for t in body["top"]]
    assert confidences == sorted(confidences, reverse=True)
    assert confidences[0] > 0.9  # readings are very close to rice's profile


def test_exact_profile_scores_one():
    chickpea = {"N": 40, "P": 68, "K": 80, "temperature": 18.9,
                "humidity": 16.9, "ph": 7.3, "rainfall": 80.1}
    best = client.post("/api/recommend/crop", json=chickpea).json()["top"][0]
    assert best == {"crop": "chickpea", "confidence": 1.0, "season": "rabi", "category": "pulse"}


def test_recommend_crop_validates_ranges():
    bad = {**RICE_LIKE_SOIL, "ph": 20}
    assert client.post("/api/recommend/crop", json=bad).status_code == 422


def test_fertilizer_for_deficient_soil():
    res = client.post(
        "/api/recommend/fertilizer",
        json={"crop": "rice", "N": 20, "P": 10, "K": 40, "area_ha": 2},
    )
    assert res.status_code == 200
    body = res.json()
    statuses = {g["nutrient"]: g["status"] for g in body["gaps"]}
    assert statuses == {"N": "low", "P": "low", "K": "ok"}
    products = {d["product"].split()[0]: d for d in body["doses"]}
    assert set(products) == {"DAP", "Urea"}
    # total is per-hectare dose times area
    assert products["DAP"]["total_kg"] == round(products["DAP"]["kg_per_ha"] * 2, 1)


def test_fertilizer_no_dose_when_soil_is_sufficient():
    res = client.post(
        "/api/recommend/fertilizer",
        json={"crop": "rice", "N": 80, "P": 48, "K": 40},
    )
    assert res.json()["doses"] == []


def test_fertilizer_unknown_crop_is_404():
    res = client.post(
        "/api/recommend/fertilizer", json={"crop": "xyz", "N": 1, "P": 1, "K": 1}
    )
    assert res.status_code == 404
