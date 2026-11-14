"""Background tasks."""

import logging
import subprocess
import sys
from datetime import datetime, timezone

from app.core.config import REPO_ROOT
from app.db.models import BatchJob
from app.db.session import SessionLocal
from app.repositories import predictions as predictions_repo
from app.schemas import SoilConditions
from app.services.recommender import recommend_many, reload_model
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="jobs.batch_recommend")
def batch_recommend(job_id: str, rows: list[dict]) -> str:
    """Recommend crops for many readings; store results atomically."""
    with SessionLocal() as db:
        job = db.get(BatchJob, job_id)
        if job is None:
            return "missing"
        job.status = "running"
        db.commit()
        try:
            soils = [SoilConditions.model_validate(r) for r in rows]
            recs = recommend_many(soils, k=3)
            # One transaction: every prediction row and the job result, or nothing.
            with db.begin():
                predictions_repo.add_many(
                    db, (predictions_repo.build(s, r, user_id=job.user_id, source="batch") for s, r in zip(soils, recs))
                )
                job.result = [
                    {"row": i, **soil.model_dump(), "top": [t.model_dump() for t in rec.top], "method": rec.method}
                    for i, (soil, rec) in enumerate(zip(soils, recs))
                ]
                job.status = "done"
                job.finished_at = datetime.now(timezone.utc)
        except Exception as exc:
            db.rollback()
            logger.exception("batch job %s failed", job_id)
            job = db.get(BatchJob, job_id)
            job.status, job.error = "failed", str(exc)[:2000]
            job.finished_at = datetime.now(timezone.utc)
            db.commit()
    return job_id


@celery_app.task(name="jobs.retrain_model")
def retrain_model() -> dict:
    """Re-run the ML training pipeline, then hot-reload the served model."""
    proc = subprocess.run(
        [sys.executable, "-m", "AIML.machine_learning.crop_classifier", "--no-register"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=850,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"training failed: {proc.stderr[-1500:]}")
    return reload_model()
