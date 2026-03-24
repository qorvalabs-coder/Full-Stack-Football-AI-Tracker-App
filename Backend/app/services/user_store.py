from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.models.auth import User

logger = get_logger(__name__)

_USERS_FILE = Path(settings.data_dir) / "users.json"


def _load_raw() -> list[dict]:
    if not _USERS_FILE.exists():
        return []
    try:
        return json.loads(_USERS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_raw(users: list[dict]) -> None:
    _USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")


def find_by_email(email: str) -> Optional[User]:
    for raw in _load_raw():
        if raw.get("email", "").lower() == email.lower():
            return User(**raw)
    return None


def find_by_id(user_id: str) -> Optional[User]:
    for raw in _load_raw():
        if raw.get("id") == user_id:
            return User(**raw)
    return None


def create_user(name: str, email: str, hashed_password: str) -> User:
    from datetime import datetime, timezone
    user = User(
        id=str(uuid.uuid4()),
        name=name,
        email=email.lower(),
        hashed_password=hashed_password,
        plan="Active Member",
        joined_date=datetime.now(timezone.utc).strftime("%B %Y"),
    )
    users = _load_raw()
    users.append(user.model_dump())
    _save_raw(users)
    logger.info("Registered new user: %s (%s)", name, email)
    return user
