from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel


class User(BaseModel):
    """Stored user entity (never returned directly to API consumers)."""
    id: str
    name: str
    email: str
    hashed_password: str
    plan: str = "Active Member"
    joined_date: str = ""

    model_config = ConfigDict(populate_by_name=True)


class UserPublic(BaseModel):
    """Safe user representation returned by GET /me."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    email: str
    plan: str
    joined_date: str


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    access_token: str
    token_type: str = "bearer"
    user: UserPublic
