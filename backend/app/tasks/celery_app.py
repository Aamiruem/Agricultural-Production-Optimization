"""Celery application.

With REDIS_URL set, tasks go to Redis and run in a worker:
    celery -A app.tasks.celery_app worker --loglevel=info
Without Redis (local dev, tests) tasks run inline ("eager"), so the API
behaves the same with no extra services.
"""
from celery import Celery

from app.core.config import get_settings

_s = get_settings()

celery_app = Celery(
    "agrioptima",
    broker=_s.redis_url or "memory://",
    backend=_s.redis_url or "cache+memory://",
    include=["app.tasks.jobs"],
)
celery_app.conf.update(
    task_always_eager=_s.tasks_eager,
    task_eager_propagates=False,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,  # re-deliver if a worker dies mid-task
    worker_prefetch_multiplier=1,
    task_time_limit=900,
)
