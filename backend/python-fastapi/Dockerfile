# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f backend/Dockerfile -t agri-api .
#   --target api     FastAPI server (default)
#   --target worker  Celery worker + the ML training stack (PyTorch CPU, MLflow)

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN useradd --create-home --uid 10001 app
WORKDIR /app

FROM base AS deps
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --prefix=/install -r backend/requirements.txt

FROM base AS worker-deps
COPY --from=deps /install /usr/local
COPY ml/requirements.txt ml/requirements.txt
# CPU-only PyTorch wheels keep the image far smaller than the CUDA build.
RUN pip install --prefix=/install --extra-index-url https://download.pytorch.org/whl/cpu -r ml/requirements.txt

FROM base AS worker
COPY --from=deps /install /usr/local
COPY --from=worker-deps /install /usr/local
COPY --chown=app:app backend/ backend/
COPY --chown=app:app ml/ ml/
WORKDIR /app/backend
USER app
CMD ["celery", "-A", "app.tasks.celery_app", "worker", "--loglevel=info", "--concurrency=2"]

FROM base AS api
COPY --from=deps /install /usr/local
COPY --chown=app:app backend/ backend/
COPY --chown=app:app ml/ ml/
WORKDIR /app/backend
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"
# Apply database migrations, then serve. --proxy-headers: runs behind Nginx / an AWS ALB.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
