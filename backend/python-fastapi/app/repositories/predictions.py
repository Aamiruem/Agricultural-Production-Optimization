"""Data access for predictions."""

from collections.abc import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Prediction
from app.schemas import CropRecommendation, SoilConditions


def build(soil: SoilConditions, rec: CropRecommendation, *, user_id: int | None, source: str = "api") -> Prediction:
    best = rec.top[0]
    return Prediction(
        user_id=user_id,
        **soil.model_dump(),
        top_crop=best.crop,
        confidence=best.confidence,
        method=rec.method,
        source=source,
    )


def add(db: Session, prediction: Prediction) -> Prediction:
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def add_many(db: Session, predictions: Iterable[Prediction]) -> None:
    """Caller controls the transaction (used inside `with db.begin()`)."""
    db.add_all(list(predictions))


def list_for_user(db: Session, user_id: int, *, limit: int, offset: int) -> tuple[list[Prediction], int]:
    base = select(Prediction).where(Prediction.user_id == user_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(limit).offset(offset)
    ).all()
    return list(rows), total


def crop_counts_for_user(db: Session, user_id: int) -> list[dict]:
    """GROUP BY top_crop with count and average confidence."""
    stmt = (
        select(
            Prediction.top_crop.label("crop"),
            func.count(Prediction.id).label("count"),
            func.avg(Prediction.confidence).label("avg_confidence"),
        )
        .where(Prediction.user_id == user_id)
        .group_by(Prediction.top_crop)
        .order_by(func.count(Prediction.id).desc())
    )
    return [
        {"crop": r.crop, "count": r.count, "avg_confidence": round(float(r.avg_confidence), 4)}
        for r in db.execute(stmt)
    ]


def total(db: Session) -> int:
    return db.scalar(select(func.count(Prediction.id))) or 0
