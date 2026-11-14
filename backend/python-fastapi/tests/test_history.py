from tests.conftest import auth_header, register

RICE = {"N": 85, "P": 45, "K": 40, "temperature": 23.5, "humidity": 82, "ph": 6.5, "rainfall": 230}
CHICKPEA = {"N": 40, "P": 68, "K": 80, "temperature": 18.9, "humidity": 16.9, "ph": 7.3, "rainfall": 80.1}


def test_anonymous_recommendations_are_not_saved(client):
    user = register(client)
    client.post("/api/recommend/crop", json=RICE)
    assert client.get("/api/predictions", headers=auth_header(user)).json()["total"] == 0


def test_history_pagination_and_stats(client):
    user = register(client)
    h = auth_header(user)
    for soil in (RICE, RICE, CHICKPEA):
        assert client.post("/api/recommend/crop", json=soil, headers=h).status_code == 200

    page = client.get("/api/predictions", params={"limit": 2}, headers=h).json()
    assert page["total"] == 3 and len(page["items"]) == 2
    assert page["items"][0]["top_crop"] == "chickpea"  # newest first

    stats = client.get("/api/predictions/stats", headers=h).json()
    assert [(s["crop"], s["count"]) for s in stats] == [("rice", 2), ("chickpea", 1)]


def test_history_is_private(client):
    a, b = register(client, "a@example.com"), register(client, "b@example.com")
    client.post("/api/recommend/crop", json=RICE, headers=auth_header(a))
    assert client.get("/api/predictions", headers=auth_header(b)).json()["total"] == 0


def test_batch_job_runs_and_saves_predictions(client):
    user = register(client)
    h = auth_header(user)
    res = client.post("/api/jobs/batch", json={"rows": [RICE, CHICKPEA]}, headers=h)
    assert res.status_code == 202
    job = client.get(f"/api/jobs/{res.json()['id']}", headers=h).json()
    assert job["status"] == "done" and job["total_rows"] == 2
    assert [r["top"][0]["crop"] for r in job["result"]] == ["rice", "chickpea"]
    assert client.get("/api/predictions", headers=h).json()["total"] == 2


def test_batch_job_from_csv(client):
    user = register(client)
    h = auth_header(user)
    csv = "N,P,K,temperature,humidity,ph,rainfall\n85,45,40,23.5,82,6.5,230\n"
    res = client.post("/api/jobs/batch-csv", files={"file": ("soil.csv", csv, "text/csv")}, headers=h)
    assert res.status_code == 202, res.text
    assert res.json()["status"] == "done"

    bad = "N,P,K,temperature,humidity,ph,rainfall\n85,45,40,23.5,82,99,230\n"
    res = client.post("/api/jobs/batch-csv", files={"file": ("bad.csv", bad, "text/csv")}, headers=h)
    assert res.status_code == 422


def test_jobs_are_private_and_require_auth(client):
    a, b = register(client, "a@example.com"), register(client, "b@example.com")
    job_id = client.post("/api/jobs/batch", json={"rows": [RICE]}, headers=auth_header(a)).json()["id"]
    assert client.get(f"/api/jobs/{job_id}", headers=auth_header(b)).status_code == 404
    assert client.post("/api/jobs/batch", json={"rows": [RICE]}).status_code == 401


def test_timestamps_are_utc_aware(client):
    user = register(client)
    assert user["user"]["created_at"].endswith(("Z", "+00:00"))
    client.post("/api/recommend/crop", json=RICE, headers=auth_header(user))
    item = client.get("/api/predictions", headers=auth_header(user)).json()["items"][0]
    assert item["created_at"].endswith(("Z", "+00:00"))
