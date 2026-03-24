from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_players():
    resp = client.get("/api/v1/players")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
    assert len(data) >= 10


def test_get_player():
    resp = client.get("/api/v1/players/player_1")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["id"] == "player_1"
    assert data["name"] == "Alex Hunter"


def test_player_not_found():
    resp = client.get("/api/v1/players/ghost_player")
    assert resp.status_code == 404
    assert resp.json()["error_code"] == "NOT_FOUND"


def test_player_stats():
    resp = client.get("/api/v1/players/player_1/stats")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "passAccuracy" in data
    assert "turnoverRate" in data
    assert "attributes" in data
    assert data["passAccuracy"] == round(26 / 32 * 100, 1)


def test_player_stats_not_found():
    resp = client.get("/api/v1/players/nobody/stats")
    assert resp.status_code == 404


def test_player_heatmap():
    resp = client.get("/api/v1/players/player_1/heatmap")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["playerId"] == "player_1"
    assert isinstance(data["points"], list)
    assert len(data["points"]) >= 1
    for pt in data["points"]:
        assert "x" in pt and "y" in pt and "value" in pt


def test_player_heatmap_not_found():
    resp = client.get("/api/v1/players/nobody/heatmap")
    assert resp.status_code == 404
