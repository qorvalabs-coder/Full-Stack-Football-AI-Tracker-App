from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.logging import get_logger
from app.models.auth import User, UserPublic
from app.services import user_store

logger = get_logger(__name__)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password helpers ─────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> str:
    """Decode JWT and return user_id (sub). Raises AuthenticationError on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token payload missing subject.")
        return user_id
    except JWTError as exc:
        raise AuthenticationError(f"Invalid or expired token: {exc}") from exc


# ── Business operations ───────────────────────────────────────────────────────

def register(name: str, email: str, password: str) -> tuple[User, str]:
    if user_store.find_by_email(email):
        raise ConflictError(f"Email '{email}' is already registered.")
    hashed = hash_password(password)
    user = user_store.create_user(name=name, email=email, hashed_password=hashed)
    token = create_access_token(user.id)
    return user, token


def login(email: str, password: str) -> tuple[User, str]:
    user = user_store.find_by_email(email)
    if not user or not verify_password(password, user.hashed_password):
        raise AuthenticationError("Invalid email or password.")
    token = create_access_token(user.id)
    return user, token


def get_current_user(token: str) -> User:
    user_id = decode_token(token)
    user = user_store.find_by_id(user_id)
    if not user:
        raise AuthenticationError("User no longer exists.")
    return user


def to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.name,
        email=user.email,
        plan=user.plan,
        joined_date=user.joined_date,
    )
