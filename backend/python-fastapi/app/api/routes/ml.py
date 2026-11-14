import json

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from app.api.deps import AdminUser, DbSession
from app.core.cache import get_cache, rounded_key
from app.core.config import REPO_ROOT
from app.repositories import predictions as predictions_repo
from app.repositories import users as users_repo
from app.schemas import SoilConditions
from app.services.recommender import get_bundle, model_info, reload_model, training_report
from app.tasks.jobs import retrain_model

router = APIRouter(tags=["ml & admin"])


@router.get("/ml/model")
def get_model():
    """Model being served + the training leaderboard from `python -m AIML.machine_learning.crop_classifier`."""
    report = training_report()
    return {
        "serving": model_info(),
        "report": None if report is None else {
            k: report.get(k) for k in
            ("best_model", "trained_at", "rows", "classes", "features", "leaderboard", "feature_importances")
        },
    }


YIELD_METRICS_PATH = REPO_ROOT / "AIML" / "models" / "yield_metrics.json"


@router.get("/ml/yield-model")
def get_yield_model():
    """Leaderboard of the yield regressors from `python -m AIML.machine_learning.yield_regression`."""
    if not YIELD_METRICS_PATH.exists():
        raise HTTPException(status_code=404, detail="Yield model has not been trained on this instance.")
    return json.loads(YIELD_METRICS_PATH.read_text(encoding="utf-8"))


@router.post("/ml/explain")
async def explain(soil: SoilConditions, top: int = Query(default=3, ge=1, le=5)):
    """Why the model recommends each crop: per-feature TreeSHAP contributions to its probability.

    Contributions are in probability units; base_value + sum(contributions) = probability.
    """
    bundle = get_bundle()
    if bundle is None:
        raise HTTPException(status_code=503, detail="No trained crop model is loaded, so there is nothing to explain.")
    from AIML.advanced_ml.attribution import explain_crop

    key = rounded_key(f"explain:{id(bundle)}:top={top}", soil.model_dump())
    return await run_in_threadpool(
        get_cache("crop_explanation").get_or_compute, key, lambda: explain_crop(bundle, soil.model_dump(), top=top))


@router.post("/ml/reload")
def reload(_: AdminUser):
    return reload_model()


@router.post("/ml/retrain", status_code=status.HTTP_202_ACCEPTED)
def retrain(_: AdminUser):
    task = retrain_model.delay()
    return {"task_id": task.id, "status": task.status}


@router.get("/admin/users")
def admin_users(_: AdminUser, db: DbSession):
    return {"users": users_repo.activity_report(db), "total_predictions": predictions_repo.total(db)}
