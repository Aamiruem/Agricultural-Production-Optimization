from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.common import UtcDatetime


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if v.isdigit() or v.isalpha():
            raise ValueError("Password must mix letters and numbers")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    created_at: UtcDatetime


class TokenResponse(BaseModel):
    """OAuth 2.0 token response (RFC 6749 §5.1)."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
