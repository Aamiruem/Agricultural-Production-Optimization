import csv
import io
import uuid

from fastapi import APIRouter, HTTPException, Query, UploadFile, status
from pydantic import ValidationError

from app.api.deps import CurrentUser, DbSession
from app.db.models import BatchJob
from app.repositories import predictions as predictions_repo
from app.schemas import SoilConditions
from app.schemas.history import BatchJobOut, BatchRequest, CropCount, PredictionOut, PredictionPage
from app.tasks.jobs import batch_recommend

router = APIRouter(tags=["history & jobs"])
MAX_CSV_BYTES = 1_000_000
MAX_ROWS = 1000


@router.get("/predictions", response_model=PredictionPage)
def my_predictions(
    user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    items, total = predictions_repo.list_for_user(db, user.id, limit=limit, offset=offset)
    return PredictionPage(
        items=[PredictionOut.model_validate(p) for p in items], total=total, limit=limit, offset=offset
    )


@router.get("/predictions/stats", response_model=list[CropCount])
def my_prediction_stats(user: CurrentUser, db: DbSession):
    return predictions_repo.crop_counts_for_user(db, user.id)


def _enqueue(db, user_id: int, rows: list[dict]) -> BatchJob:
    job = BatchJob(id=str(uuid.uuid4()), user_id=user_id, total_rows=len(rows))
    db.add(job)
    db.commit()
    batch_recommend.delay(job.id, rows)  # Celery: worker with Redis, inline without
    db.refresh(job)
    return job


@router.post("/jobs/batch", response_model=BatchJobOut, status_code=status.HTTP_202_ACCEPTED)
def create_batch_job(req: BatchRequest, user: CurrentUser, db: DbSession):
    return _enqueue(db, user.id, [r.model_dump() for r in req.rows])


@router.post("/jobs/batch-csv", response_model=BatchJobOut, status_code=status.HTTP_202_ACCEPTED)
async def create_batch_job_from_csv(file: UploadFile, user: CurrentUser, db: DbSession):
    """CSV with header N,P,K,temperature,humidity,ph,rainfall (max 1000 rows, 1 MB)."""
    raw = await file.read(MAX_CSV_BYTES + 1)
    if len(raw) > MAX_CSV_BYTES:
        raise HTTPException(413, "CSV must be 1 MB or smaller")
    try:
        reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
        rows = [SoilConditions.model_validate(r).model_dump() for _, r in zip(range(MAX_ROWS + 1), reader)]
    except UnicodeDecodeError:
        raise HTTPException(400, "CSV must be UTF-8 text") from None
    except ValidationError as exc:
        raise HTTPException(422, f"Invalid row: {exc.errors(include_url=False)[0]['msg']}") from None
    if not rows:
        raise HTTPException(400, "CSV has no data rows")
    if len(rows) > MAX_ROWS:
        raise HTTPException(413, f"At most {MAX_ROWS} rows per job")
    return _enqueue(db, user.id, rows)


@router.get("/jobs/{job_id}", response_model=BatchJobOut)
def get_job(job_id: str, user: CurrentUser, db: DbSession):
    job = db.get(BatchJob, job_id)
    if job is None or job.user_id != user.id:  # don't reveal other users' jobs
        raise HTTPException(404, "Job not found")
    return job
