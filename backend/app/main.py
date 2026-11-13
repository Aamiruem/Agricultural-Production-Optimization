"""FastAPI application: AI/ML service of AgriOptima."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import assistant, auth, crops, health, history, ml, realtime
from app.core.config import get_settings
from app.core.logging import RequestLogMiddleware, configure_logging
from app.db import models  # noqa: F401  (register tables on Base.metadata)
from app.db.session import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    if get_settings().auto_create_tables:
        Base.metadata.create_all(engine)  # dev convenience; production runs Alembic migrations
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Crop & fertilizer recommendations, ML model serving, auth, batch jobs and an AI assistant.",
        lifespan=lifespan,
    )
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    for module in (health, auth, crops, history, ml, assistant, realtime):
        app.include_router(module.router, prefix="/api")
    return app


app = create_app()
