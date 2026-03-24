from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_teams():
    resp = client.get("/api/v1/teams")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 2
    names = {t["name"] for t in data}
    assert "FC Green Eagles" in names
    assert "Black Panthers FC" in names


def test_get_team():
    resp = client.get("/api/v1/teams/team_1")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["id"] == "team_1"
    assert data["stadium"] == "Eagle Nest Stadium"
    assert "attributes" in data
    assert "stats" in data


def test_team_not_found():
    resp = client.get("/api/v1/teams/bad_team")
    assert resp.status_code == 404
    assert resp.json()["error_code"] == "NOT_FOUND"


def test_team_players():
    resp = client.get("/api/v1/teams/team_1/players")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
    for p in data:
        assert p["teamId"] == "team_1"


def test_team_possession():
    resp = client.get("/api/v1/teams/team_1/possession")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "percent" in data
    assert "opponentPercent" in data
    total = data["percent"] + data["opponentPercent"]
    assert abs(total - 100.0) < 1.0


def test_team_possession_not_found():
    resp = client.get("/api/v1/teams/nobody/possession")
    assert resp.status_code == 404
