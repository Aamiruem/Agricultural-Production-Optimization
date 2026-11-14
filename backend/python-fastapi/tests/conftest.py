import os
import tempfile
from pathlib import Path

# Configure the app BEFORE it is imported: throwaway DB, no LLM, no trained model.
_tmp = Path(tempfile.mkdtemp(prefix="agri-tests-"))
os.environ.update(
    {
        "ENVIRONMENT": "test",
        # SQLite by default; CI sets TEST_DATABASE_URL to a PostgreSQL service.
        "DATABASE_URL": os.environ.get("TEST_DATABASE_URL", f"sqlite:///{(_tmp / 'test.db').as_posix()}"),
        "ASSISTANT_LLM": "off",
        "EMBEDDINGS": "tfidf",
        "MODEL_PATH": str(_tmp / "no-model.joblib"),
        "METRICS_PATH": str(_tmp / "no-metrics.json"),
        "CELERY_EAGER": "true",
        "WARMUP": "false",  # tests swap model paths; no background loader racing them
    }
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:  # runs lifespan (creates tables)
        yield c


@pytest.fixture(autouse=True)
def clean_db(client):
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


def register(client, email="farmer@example.com", password="green123", name="Test Farmer"):
    res = client.post("/api/auth/register", json={"email": email, "password": password, "full_name": name})
    assert res.status_code == 201, res.text
    return res.json()


def auth_header(token_response) -> dict:
    return {"Authorization": f"Bearer {token_response['access_token']}"}
