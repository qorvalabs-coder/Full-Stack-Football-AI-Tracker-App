from __future__ import annotations

import io
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.exceptions import DataLoadError
from app.services import json_loader

client = TestClient(app)


def test_loader_missing_file(tmp_path, monkeypatch):
    monkeypatch.setattr(json_loader, "_data_path", lambda: tmp_path)
    json_loader.load_teams.cache_clear()
    json_loader.load_players.cache_clear()
    json_loader.load_matches.cache_clear()
    with pytest.raises(DataLoadError):
        json_loader._read_json("teams.json")


def test_loader_invalid_json(tmp_path, monkeypatch):
    (tmp_path / "teams.json").write_text("{bad json", encoding="utf-8")
    monkeypatch.setattr(json_loader, "_data_path", lambda: tmp_path)
    json_loader.load_teams.cache_clear()
    with pytest.raises(DataLoadError):
        json_loader._read_json("teams.json")


def test_upload_valid_json():
    match_payload = [
        {
            "id": "test_match",
            "date": "2026-03-24",
            "home_team": {"id": "team_1", "name": "FC Green Eagles", "emoji": "🦅"},
            "away_team": {"id": "team_2", "name": "Black Panthers FC", "emoji": "🐆"},
            "home_score": 2,
            "away_score": 0,
        }
    ]
    file_bytes = json.dumps(match_payload).encode()
    resp = client.post(
        "/api/v1/upload",
        files={"file": ("test_match.json", io.BytesIO(file_bytes), "application/json")},
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["matchId"] == "test_match"
    assert data["status"] == "accepted"


def test_upload_invalid_json():
    resp = client.post(
        "/api/v1/upload",
        files={"file": ("bad.json", io.BytesIO(b"{not json"), "application/json")},
    )
    assert resp.status_code == 400
    assert resp.json()["error_code"] == "INVALID_UPLOAD"


def test_upload_rejects_non_json():
    resp = client.post(
        "/api/v1/upload",
        files={"file": ("model.pkl", io.BytesIO(b"binary"), "application/octet-stream")},
    )
    assert resp.status_code == 400
    assert "json" in resp.json()["detail"].lower()
