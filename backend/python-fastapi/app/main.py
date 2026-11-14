"""FastAPI application: AI/ML service of AgriOptima."""
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import REPO_ROOT, get_settings

# The AIML package (models, SHAP attribution, MCP tools) lives at the repository root.
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.api.routes import (  # noqa: E402
    assistant, auth, crops, health, history, ml, realtime, system, yield_analytics, yield_prediction,
)
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
