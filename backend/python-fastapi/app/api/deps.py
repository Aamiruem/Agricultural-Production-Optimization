"""Shared FastAPI dependencies: DB session, current user, role checks (RBAC)."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db
from app.repositories import users as users_repo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_optional_user(db: DbSession, token: Annotated[str | None, Depends(oauth2_scheme)]) -> User | None:
    if not token:
        return None
    try:
        claims = decode_access_token(token)
        return users_repo.get(db, int(claims["sub"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise _UNAUTHORIZED from None


def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise _UNAUTHORIZED
    return user


def require_role(*roles: str):
    def checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return checker


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_role("admin"))]
