# Build from the repository root:
#   docker build -f backend/python-fastapi/Dockerfile --target api .      (default: last stage)
#   docker build -f backend/python-fastapi/Dockerfile --target worker .   (Celery worker)
# The same image also runs the MCP server (see docker-compose.yml).
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app
WORKDIR /app

COPY backend/python-fastapi/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Keep the monorepo layout inside the image so app settings and AIML/config.py
# resolve the same model and data paths as in local development.
COPY backend/python-fastapi/app /app/backend/python-fastapi/app
COPY backend/python-fastapi/migrations /app/backend/python-fastapi/migrations
COPY backend/python-fastapi/alembic.ini /app/backend/python-fastapi/alembic.ini
COPY AIML /app/AIML
WORKDIR /app/backend/python-fastapi

# ---------------------------------------------------------------- Celery worker
FROM base AS worker
CMD ["celery", "-A", "app.tasks.celery_app", "worker", "--loglevel=info", "--concurrency=2"]

# ---------------------------------------------------------------- API (default)
FROM base AS api
EXPOSE 8000
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"
# Several worker processes per container (WEB_CONCURRENCY); the gateway balances across containers.
ENV WEB_CONCURRENCY=2
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY} --proxy-headers --forwarded-allow-ips='*' --timeout-keep-alive 30"]
