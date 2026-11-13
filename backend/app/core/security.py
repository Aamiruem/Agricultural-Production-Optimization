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
