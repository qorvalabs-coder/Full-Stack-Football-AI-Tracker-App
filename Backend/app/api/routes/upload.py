from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import InvalidUploadError
from app.core.logging import get_logger
from app.models.responses import ApiResponse
from app.models.schemas import UploadReceiptSchema
from app.services.json_loader import bust_cache

router = APIRouter()
logger = get_logger(__name__)

_REQUIRED_MATCH_KEYS = {"id", "date", "home_team", "away_team", "home_score", "away_score"}


@router.post("", response_model=ApiResponse[UploadReceiptSchema], status_code=201)
async def upload_match(
    file: UploadFile = File(..., description="JSON match data file"),
) -> ApiResponse:
    """
    Accept a JSON match file and store it in DATA_DIR.
    Only JSON uploads are allowed — no pickle or joblib files.
    """
    # ── Validate file type ─────────────────────────────────────────────────
    filename = file.filename or "upload.json"
    if not filename.lower().endswith(".json"):
        raise InvalidUploadError("Only .json files are accepted. Pickle/joblib uploads are not permitted.")

    # ── Read and parse ─────────────────────────────────────────────────────
    raw_bytes = await file.read()
    try:
        payload = json.loads(raw_bytes)
    except json.JSONDecodeError as exc:
        raise InvalidUploadError(f"Invalid JSON: {exc}") from exc

    # Handle both single-match dict and list of matches
    match_list = payload if isinstance(payload, list) else [payload]

    for match in match_list:
        missing = _REQUIRED_MATCH_KEYS - set(match.keys())
        if missing:
            raise InvalidUploadError(f"Missing required fields: {missing}")

    match_id = match_list[0].get("id", "uploaded_match")

    # ── Persist to DATA_DIR ────────────────────────────────────────────────
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    dest = data_dir / filename

    dest.write_text(json.dumps(match_list, indent=2), encoding="utf-8")
    logger.info("Uploaded match file '%s' → %s", filename, dest)

    # Bust in-memory caches so next API call picks up new data
    bust_cache()

    receipt = UploadReceiptSchema(
        match_id=match_id,
        filename=filename,
        status="accepted",
        message=f"Successfully uploaded {len(match_list)} match(es).",
    )
    return ApiResponse.ok(receipt, message="Upload complete")
