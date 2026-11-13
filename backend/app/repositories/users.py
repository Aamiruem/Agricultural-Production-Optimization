"""Data access for users (repository layer: SQL lives here, not in routes)."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Prediction, User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def get(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create(db: Session, *, email: str, full_name: str, hashed_password: str, role: str = "farmer") -> User:
    user = User(email=email.lower(), full_name=full_name, hashed_password=hashed_password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def count(db: Session) -> int:
    return db.scalar(select(func.count(User.id))) or 0


def activity_report(db: Session) -> list[dict]:
    """LEFT JOIN users → predictions, grouped per user (users with 0 predictions included)."""
    stmt = (
        select(
            User.id,
            User.email,
            User.role,
            func.count(Prediction.id).label("predictions"),
            func.max(Prediction.created_at).label("last_prediction_at"),
        )
        .join(Prediction, Prediction.user_id == User.id, isouter=True)
        .group_by(User.id, User.email, User.role)
        .order_by(func.count(Prediction.id).desc(), User.id)
    )
    return [dict(row._mapping) for row in db.execute(stmt)]
