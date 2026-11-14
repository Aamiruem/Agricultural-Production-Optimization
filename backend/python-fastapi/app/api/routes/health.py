from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession
from app.services.recommender import model_info

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: DbSession):
    try:
        db.execute(text("SELECT 1"))
        database = "ok"
    except Exception:
        database = "unavailable"
    return {"status": "ok" if database == "ok" else "degraded", "database": database, "model": model_info()["method"]}
