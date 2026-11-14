"""Authentication use-cases (service layer)."""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.repositories import users as users_repo
from app.schemas.auth import RegisterRequest, TokenResponse, UserOut


class EmailTakenError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


def register(db: Session, req: RegisterRequest) -> User:
    if users_repo.get_by_email(db, req.email):
        raise EmailTakenError(req.email)
    # The first account becomes the admin, so a fresh install can be managed.
    role = "admin" if users_repo.count(db) == 0 else "farmer"
    try:
        return users_repo.create(
            db,
            email=req.email,
            full_name=req.full_name,
            hashed_password=hash_password(req.password),
            role=role,
        )
    except IntegrityError as exc:  # race: same email registered concurrently
        db.rollback()
        raise EmailTakenError(req.email) from exc


def authenticate(db: Session, email: str, password: str) -> User:
    user = users_repo.get_by_email(db, email)
    # Always run a hash verification to keep timing similar for unknown emails.
    hashed = user.hashed_password if user else hash_password("timing-equaliser-0")
    if not verify_password(password, hashed) or user is None:
        raise InvalidCredentialsError()
    return user


def issue_token(user: User) -> TokenResponse:
    token, expires_in = create_access_token(user_id=user.id, email=user.email, name=user.full_name, role=user.role)
    return TokenResponse(access_token=token, expires_in=expires_in, user=UserOut.model_validate(user))
