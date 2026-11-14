"""FastAPI application: AI/ML service of AgriSmart.

Start it from backend/python-fastapi (recommended):
    uvicorn app.main:app --reload
or from anywhere, including inside this folder:
    python main.py
"""
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Make `app` (backend/python-fastapi) and `AIML` (repository root) importable however
# the server is launched — e.g. `python main.py` from inside app/ would otherwise fail
# with "No module named 'app'".
_SERVICE_DIR = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[3]
for _path in (_SERVICE_DIR, _REPO_ROOT):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.middleware.gzip import GZipMiddleware  # noqa: E402

from app.api.routes import (  # noqa: E402
    assistant, auth, crops, health, history, ml, realtime, system, yield_analytics, yield_prediction,
)
from app.core.config import get_settings  # noqa: E402
from app.core.logging import RequestLogMiddleware, configure_logging  # noqa: E402
from app.core.resilience import LoadShedMiddleware  # noqa: E402
from app.db import models  # noqa: E402,F401  (register tables on Base.metadata)
from app.db.session import Base, engine  # noqa: E402
from app.services.warmup import start_warmup  # noqa: E402


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    settings = get_settings()
    if settings.auto_create_tables:
        Base.metadata.create_all(engine)  # dev convenience; production runs Alembic migrations
    if settings.warmup:
        start_warmup()  # load models / SHAP in the background; health checks answer immediately
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.1.0",
        description="Crop & fertilizer recommendations, ML model serving and explanations (SHAP), auth, "
                    "batch jobs, an AI assistant and platform status.",
        lifespan=lifespan,
    )
    # Added innermost first. Request order: CORS -> load shedding -> logging -> gzip -> routes,
    # so even a shed 503 carries CORS headers and the browser can read Retry-After.
    app.add_middleware(GZipMiddleware, minimum_size=1024)  # skips text/event-stream (SSE)
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(LoadShedMiddleware, max_concurrency=settings.max_concurrency)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Served-By", "Retry-After"],
    )
    for module in (health, auth, crops, history, ml, yield_prediction, yield_analytics, assistant, realtime, system):
        app.include_router(module.router, prefix="/api")
    return app


app = create_app()


if __name__ == "__main__":  # `python main.py` / `python app/main.py`
    import os

    import uvicorn

    uvicorn.run("app.main:app", host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))
