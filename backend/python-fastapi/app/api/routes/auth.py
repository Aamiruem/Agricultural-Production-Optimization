import logging
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.security import (
    RESET_MINUTES,
    create_reset_token,
    decode_reset_token,
    hash_password,
    reset_token_matches,
    verify_password,
)
from app.repositories import users as users_repo
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ProfileUpdate,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from app.services import auth as auth_service
from app.services.mailer import MailNotConfiguredError, mail_configured, send_mail

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("agrioptima.auth")

_RESET_SENT = "If an account exists for that email, a password-reset link has been sent. It expires in 30 minutes."


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


@router.patch("/me", response_model=UserOut)
def update_me(req: ProfileUpdate, user: CurrentUser, db: DbSession):
    user.full_name = req.full_name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(req: ChangePasswordRequest, user: CurrentUser, db: DbSession):
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    user.hashed_password = hash_password(req.new_password)
    db.commit()


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(req: ForgotPasswordRequest, db: DbSession):
    """Email a reset link. The response is the same whether or not the email is registered.

    Without SMTP: development returns the link in `dev_reset_url` (and logs it); production
    answers 503 instead of claiming an email was sent.
    """
    settings = get_settings()
    production = settings.environment == "production"
    if production and not mail_configured():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Password reset by email is not configured on this server."
        )
    user = users_repo.get_by_email(db, req.email)
    if not user:
        return {"detail": _RESET_SENT}
    token = create_reset_token(user_id=user.id, hashed_password=user.hashed_password)
    url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    if mail_configured():
        try:
            send_mail(
                user.email,
                "Reset your AgriSmart password",
                f"Hello {user.full_name},\n\nUse this link within {RESET_MINUTES} minutes to choose a new password:\n{url}\n\n"
                "If you did not ask for this, ignore this email.\n\n— AgriSmart",
            )
        except (OSError, MailNotConfiguredError) as exc:
            log.error("reset email failed: %s", exc)
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY, "Could not send the reset email. Try again later."
            ) from exc
        return {"detail": _RESET_SENT}
    log.warning("SMTP not configured — development reset link for user %s: %s", user.id, url)
    return {"detail": _RESET_SENT, "dev_reset_url": url, "dev_note": "SMTP is not configured; development only."}


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(req: ResetPasswordRequest, db: DbSession):
    invalid = HTTPException(
        status.HTTP_400_BAD_REQUEST, "This reset link is invalid or has expired. Request a new one."
    )
    try:
        claims = decode_reset_token(req.token)
        user = users_repo.get(db, int(claims["sub"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise invalid from None
    if not user or not reset_token_matches(claims, user.hashed_password):
        raise invalid
    user.hashed_password = hash_password(req.password)
    db.commit()
