"""Application settings, read from environment variables (and backend/.env)."""
from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
DEV_JWT_SECRET = "dev-only-insecure-secret-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AgriOptima API"
    environment: str = "development"  # development | test | production

    # SQL database (SQLAlchemy URL). SQLite locally, PostgreSQL in Docker/AWS:
    # postgresql+psycopg://user:pass@host:5432/agrioptima
    database_url: str = "sqlite:///./agrioptima.db"
    auto_create_tables: bool = True  # production uses `alembic upgrade head`

    # JWT (shared with the Node farm-service, which verifies the same tokens)
    jwt_secret: str = DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "agrioptima-api"
    jwt_audience: str = "agrioptima"
    access_token_minutes: int = 60

    cors_origins: str = "http://localhost:3000"

    # Background jobs: Celery with Redis; without Redis tasks run inline (eager).
    redis_url: str | None = None
    celery_eager: bool | None = None

    # ML model produced by `python -m ml.train`
    model_path: Path = REPO_ROOT / "ml" / "models" / "crop_model.joblib"
    metrics_path: Path = REPO_ROOT / "ml" / "models" / "metrics.json"

    # AI assistant
    assistant_llm: str = "auto"  # auto | on | off
    anthropic_model: str = "claude-opus-5-5"
    qdrant_url: str | None = None  # None -> in-process vector store
    qdrant_collection: str = "agri_knowledge"
    embeddings: str = "auto"  # auto | sentence-transformers | tfidf

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def tasks_eager(self) -> bool:
        return self.celery_eager if self.celery_eager is not None else not self.redis_url

    @model_validator(mode="after")
    def _check_production(self) -> "Settings":
        if self.environment == "production" and (self.jwt_secret == DEV_JWT_SECRET or len(self.jwt_secret) < 32):
            raise ValueError("Set JWT_SECRET to a random value of at least 32 characters in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
