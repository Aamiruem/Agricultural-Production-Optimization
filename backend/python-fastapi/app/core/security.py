"""Password hashing (Argon2) and JWT access tokens."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

_hasher = PasswordHash.recommended()  # Argon2id


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _hasher.verify(password, hashed)


def create_access_token(*, user_id: int, email: str, name: str, role: str) -> tuple[str, int]:
    """Return (token, expires_in_seconds). Claims follow RFC 7519 / OIDC naming."""
    s = get_settings()
    now = datetime.now(timezone.utc)
    expires = timedelta(minutes=s.access_token_minutes)
    claims = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "role": role,
        "iss": s.jwt_issuer,
        "aud": s.jwt_audience,
        "iat": now,
        "exp": now + expires,
    }
    return jwt.encode(claims, s.jwt_secret, algorithm=s.jwt_algorithm), int(expires.total_seconds())


def decode_access_token(token: str) -> dict:
    """Raises jwt.InvalidTokenError on a bad, expired or foreign token."""
    s = get_settings()
    return jwt.decode(
        token,
        s.jwt_secret,
        algorithms=[s.jwt_algorithm],
        audience=s.jwt_audience,
        issuer=s.jwt_issuer,
        options={"require": ["exp", "sub", "iss", "aud"]},
    )


# ---------------------------------------------------------------- password reset tokens
RESET_PURPOSE = "password-reset"
RESET_MINUTES = 30


def _fingerprint(hashed_password: str) -> str:
    """Changes whenever the password changes, so a reset token works only once."""
    import hashlib

    return hashlib.sha256(hashed_password.encode()).hexdigest()[:16]


def create_reset_token(*, user_id: int, hashed_password: str) -> str:
    s = get_settings()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": str(user_id),
        "purpose": RESET_PURPOSE,
        "fp": _fingerprint(hashed_password),
        "iss": s.jwt_issuer,
        "aud": f"{s.jwt_audience}:reset",
        "iat": now,
        "exp": now + timedelta(minutes=RESET_MINUTES),
    }
    return jwt.encode(claims, s.jwt_secret, algorithm=s.jwt_algorithm)


def decode_reset_token(token: str) -> dict:
    """Raises jwt.InvalidTokenError if the token is bad, expired or not a reset token."""
    s = get_settings()
    claims = jwt.decode(
        token,
        s.jwt_secret,
        algorithms=[s.jwt_algorithm],
        audience=f"{s.jwt_audience}:reset",
        issuer=s.jwt_issuer,
        options={"require": ["exp", "sub", "iss", "aud"]},
    )
    if claims.get("purpose") != RESET_PURPOSE:
        raise jwt.InvalidTokenError("not a reset token")
    return claims


def reset_token_matches(claims: dict, hashed_password: str) -> bool:
    return claims.get("fp") == _fingerprint(hashed_password)
