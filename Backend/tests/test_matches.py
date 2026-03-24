from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_matches():
    resp = client.get("/api/v1/matches")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1


def test_get_match_detail():
    resp = client.get("/api/v1/matches/match_1")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["id"] == "match_1"
    assert data["homeTeam"] == "FC Green Eagles"
    assert data["awayTeam"] == "Black Panthers FC"
    assert isinstance(data["events"], list)


def test_match_not_found():
    resp = client.get("/api/v1/matches/no_such_id")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error_code"] == "NOT_FOUND"


def test_match_overview():
    resp = client.get("/api/v1/matches/match_1/overview")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "possession" in data
    assert "passAccuracy" in data
    assert isinstance(data["stats"], list)
    # Possession should sum to 100
    poss = data["possession"]
    assert abs(poss["home"] + poss["away"] - 100.0) < 1.0


def test_match_overview_not_found():
    resp = client.get("/api/v1/matches/fake_match/overview")
    assert resp.status_code == 404
