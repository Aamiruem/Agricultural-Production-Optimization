from fastapi import APIRouter, status

from app.api.deps import AdminUser, DbSession
from app.repositories import predictions as predictions_repo
from app.repositories import users as users_repo
from app.services.recommender import model_info, reload_model, training_report
from app.tasks.jobs import retrain_model

router = APIRouter(tags=["ml & admin"])


@router.get("/ml/model")
def get_model():
    """Model being served + the training leaderboard from `python -m ml.train`."""
    report = training_report()
    return {
        "serving": model_info(),
        "report": None if report is None else {
            k: report.get(k) for k in
            ("best_model", "trained_at", "rows", "classes", "features", "leaderboard", "feature_importances")
        },
    }


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
