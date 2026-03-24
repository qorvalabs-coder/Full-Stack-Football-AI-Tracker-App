from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check() -> dict:
    """Liveness probe – always returns 200 OK."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": "development",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
