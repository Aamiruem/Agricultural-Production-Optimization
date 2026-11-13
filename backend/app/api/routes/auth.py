from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import RegisterRequest, TokenResponse, UserOut
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: DbSession):
    try:
        user = auth_service.register(db, req)
    except auth_service.EmailTakenError:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists") from None
    return auth_service.issue_token(user)


@router.post("/token", response_model=TokenResponse)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession):
    """OAuth 2.0 password grant: form fields `username` (email) and `password`."""
    try:
        user = auth_service.authenticate(db, form.username, form.password)
    except auth_service.InvalidCredentialsError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Incorrect email or password", headers={"WWW-Authenticate": "Bearer"}
        ) from None
    return auth_service.issue_token(user)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
