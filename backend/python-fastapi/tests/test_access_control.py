"""Public vs private API, password reset, profile and contact form."""

import pytest

from app.core.config import get_settings

RICE = {"N": 90, "P": 42, "K": 43, "temperature": 21, "humidity": 82, "ph": 6.5, "rainfall": 203}
PRIVATE = [
    ("get", "/api/crops", None),
    ("post", "/api/recommend/crop", RICE),
    ("post", "/api/yield/predict", {"crop": "Rice", "season": "Kharif", "state": "Punjab", "year": 2020, "area_ha": 1}),
    ("get", "/api/ml/model", None),
    ("get", "/api/weather/forecast?lat=30.8&lon=75.7", None),
    ("get", "/api/location/boundaries?lat=30.8&lon=75.7", None),
    ("post", "/api/agriculture/validate-data", {"dataset": "crop_yield"}),
    ("get", "/api/assistant/status", None),
]


def _register(client, email="farmer@example.com", password="green123"):
    r = client.post("/api/auth/register", json={"email": email, "full_name": "Ravi Kumar", "password": password})
    assert r.status_code == 201
    return r.json()["access_token"]


@pytest.mark.parametrize(("method", "path", "body"), PRIVATE)
def test_private_endpoints_need_a_session(guarded, method, path, body):
    r = getattr(guarded, method)(path, json=body) if body else getattr(guarded, method)(path)
    assert r.status_code == 401


def test_private_endpoint_works_with_a_token(guarded):
    token = _register(guarded)
    r = guarded.get("/api/location/boundaries?lat=30.8&lon=75.7", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["state"] == "Punjab"


def test_public_endpoints_stay_public(guarded):
    assert guarded.get("/api/health").status_code == 200
    assert guarded.get("/api/system/status").status_code == 200
    r = guarded.post(
        "/api/contact",
        json={
            "name": "Asha",
            "email": "asha@example.com",
            "subject": "Hello",
            "message": "I would like a demo please.",
        },
    )
    assert r.status_code == 201 and r.json()["id"] > 0


def test_contact_validation_honeypot_and_admin_listing(client):
    bad = client.post("/api/contact", json={"name": "A", "email": "nope", "subject": "x", "message": "short"})
    assert bad.status_code == 422
    bot = client.post(
        "/api/contact",
        json={"name": "Bot", "email": "b@example.com", "subject": "Spam", "message": "Buy now buy now", "website": "x"},
    )
    assert bot.status_code == 400
    admin = _register(client, "admin@example.com")  # first account becomes admin
    farmer = _register(client, "f2@example.com")
    client.post(
        "/api/contact",
        json={
            "name": "Asha",
            "email": "asha@example.com",
            "subject": "Hello",
            "message": "I would like a demo please.",
        },
    )
    assert client.get("/api/contact", headers={"Authorization": f"Bearer {farmer}"}).status_code == 403
    rows = client.get("/api/contact", headers={"Authorization": f"Bearer {admin}"}).json()
    assert rows and rows[0]["subject"] == "Hello"


def test_forgot_and_reset_password_flow(client):
    _register(client, "reset@example.com", "oldpass1")
    unknown = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    known = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert unknown.status_code == known.status_code == 202
    assert unknown.json()["detail"] == known.json()["detail"]  # no account enumeration
    url = known.json()["dev_reset_url"]  # development without SMTP only
    token = url.split("token=")[1]

    assert client.post("/api/auth/reset-password", json={"token": token, "password": "short"}).status_code == 422
    assert client.post("/api/auth/reset-password", json={"token": token, "password": "newpass22"}).status_code == 204
    # Single use: the password changed, so the token no longer matches.
    assert client.post("/api/auth/reset-password", json={"token": token, "password": "another33"}).status_code == 400
    assert (
        client.post("/api/auth/token", data={"username": "reset@example.com", "password": "oldpass1"}).status_code
        == 401
    )
    assert (
        client.post("/api/auth/token", data={"username": "reset@example.com", "password": "newpass22"}).status_code
        == 200
    )
    assert client.post("/api/auth/reset-password", json={"token": "x" * 40, "password": "newpass22"}).status_code == 400


def test_forgot_password_in_production_without_smtp_refuses(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "environment", "production")
    r = client.post("/api/auth/forgot-password", json={"email": "someone@example.com"})
    assert r.status_code == 503


def test_change_password_and_profile(client):
    token = _register(client, "me@example.com", "first111")
    auth = {"Authorization": f"Bearer {token}"}
    assert (
        client.post(
            "/api/auth/change-password", json={"current_password": "wrong", "new_password": "second22"}, headers=auth
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/auth/change-password", json={"current_password": "first111", "new_password": "second22"}, headers=auth
        ).status_code
        == 204
    )
    assert (
        client.post("/api/auth/token", data={"username": "me@example.com", "password": "second22"}).status_code == 200
    )
    r = client.patch("/api/auth/me", json={"full_name": "Ravi K."}, headers=auth)
    assert r.status_code == 200 and r.json()["full_name"] == "Ravi K."
