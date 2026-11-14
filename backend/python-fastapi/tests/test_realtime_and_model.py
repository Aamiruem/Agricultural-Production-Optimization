import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.core.config import get_settings
from app.data.crops import CROPS, FEATURES
from app.services import recommender

RICE = {"N": 85, "P": 45, "K": 40, "temperature": 23.5, "humidity": 82, "ph": 6.5, "rainfall": 230}


def _token(client):
    r = client.post(
        "/api/auth/register", json={"email": "ws@example.com", "full_name": "WS User", "password": "green123"}
    )
    return r.json()["access_token"]


def test_websocket_requires_a_token(client):
    import pytest
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/ws/recommend") as ws:
            ws.receive_json()
    assert exc.value.code == 1008


def test_websocket_live_recommendations(client):
    with client.websocket_connect(f"/api/ws/recommend?token={_token(client)}") as ws:
        ws.send_json(RICE)
        msg = ws.receive_json()
        assert msg["type"] == "recommendation" and msg["top"][0]["crop"] == "rice"

        ws.send_json({**RICE, "ph": 99})
        assert ws.receive_json()["type"] == "error"
        ws.send_text("not json")
        assert ws.receive_json()["type"] == "error"


def test_serves_trained_model_bundle(client, tmp_path, monkeypatch):
    """A bundle like the one ml/train.py writes is loaded and used for predictions."""
    classes = sorted(CROPS)
    X = pd.DataFrame([CROPS[c].features() for c in classes], columns=FEATURES)
    model = Pipeline([("clf", LogisticRegression(max_iter=5000))]).fit(X, range(len(classes)))
    path = tmp_path / "bundle.joblib"
    joblib.dump(
        {
            "model": model,
            "classes": classes,
            "features": FEATURES,
            "name": "logistic_regression",
            "metrics": {"test_accuracy": 1.0},
            "trained_at": "2026-11-13T00:00:00+00:00",
        },
        path,
    )

    monkeypatch.setattr(get_settings(), "model_path", path)
    try:
        info = recommender.reload_model()
        assert info["method"] == "ml-model" and info["model"] == "logistic_regression"
        body = client.post("/api/recommend/crop", json=CROPS["cotton"].to_dict() | {}).json()
        assert body["method"] == "ml-model"
        assert body["top"][0]["crop"] == "cotton"
        assert client.get("/api/ml/model").json()["serving"]["model"] == "logistic_regression"
    finally:
        monkeypatch.undo()
        recommender.reload_model()
