from __future__ import annotations

from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "OK"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @classmethod
    def ok(cls, data: T, message: str = "OK") -> "ApiResponse[T]":
        return cls(success=True, data=data, message=message)

    @classmethod
    def error(cls, message: str) -> "ApiResponse[None]":
        return cls(success=False, data=None, message=message)
