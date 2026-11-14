import jwt

from app.core.config import get_settings
from tests.conftest import auth_header, register


def test_register_returns_token_and_first_user_is_admin(client):
    first = register(client, "admin@example.com")
    second = register(client, "farmer@example.com")
    assert first["token_type"] == "bearer" and first["expires_in"] == 3600
    assert first["user"]["role"] == "admin"
    assert second["user"]["role"] == "farmer"

    s = get_settings()
    claims = jwt.decode(second["access_token"], s.jwt_secret, algorithms=["HS256"], audience=s.jwt_audience)
    assert claims["email"] == "farmer@example.com" and claims["iss"] == "agrioptima-api"


def test_duplicate_email_conflicts_case_insensitively(client):
    register(client, "Dup@Example.com")
    res = client.post(
        "/api/auth/register", json={"email": "dup@example.com", "password": "green123", "full_name": "Again"}
    )
    assert res.status_code == 409


def test_weak_password_rejected(client):
    res = client.post(
        "/api/auth/register", json={"email": "w@example.com", "password": "12345678", "full_name": "Weak"}
    )
    assert res.status_code == 422


def test_login_with_oauth2_password_form_and_me(client):
    register(client)
    res = client.post("/api/auth/token", data={"username": "farmer@example.com", "password": "green123"})
    assert res.status_code == 200
    me = client.get("/api/auth/me", headers=auth_header(res.json()))
    assert me.json()["email"] == "farmer@example.com"


def test_wrong_password_and_bad_tokens_are_401(client):
    register(client)
    assert (
        client.post("/api/auth/token", data={"username": "farmer@example.com", "password": "nope1234"}).status_code
        == 401
    )
    assert (
        client.post("/api/auth/token", data={"username": "ghost@example.com", "password": "nope1234"}).status_code
        == 401
    )
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"}).status_code == 401

    forged = jwt.encode(
        {"sub": "1", "iss": "agrioptima-api", "aud": "agrioptima", "exp": 9999999999}, "wrong-secret", algorithm="HS256"
    )
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401


def test_rbac_admin_only_endpoints(client):
    admin = register(client, "admin@example.com")
    farmer = register(client, "farmer@example.com")
    client.post(
        "/api/recommend/crop",
        headers=auth_header(farmer),
        json={"N": 85, "P": 45, "K": 40, "temperature": 23.5, "humidity": 82, "ph": 6.5, "rainfall": 230},
    )

    assert client.get("/api/admin/users", headers=auth_header(farmer)).status_code == 403
    res = client.get("/api/admin/users", headers=auth_header(admin))
    assert res.status_code == 200
    report = {u["email"]: u["predictions"] for u in res.json()["users"]}
    # LEFT JOIN: the admin has no predictions but is still listed
    assert report == {"farmer@example.com": 1, "admin@example.com": 0}
    assert res.json()["total_predictions"] == 1
