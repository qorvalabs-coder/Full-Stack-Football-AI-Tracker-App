from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_all_recommendations():
    resp = client.get("/api/v1/recommendations")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0


def test_recommendation_fields():
    resp = client.get("/api/v1/recommendations")
    data = resp.json()["data"]
    rec = data[0]
    for field in ("id", "scope", "title", "description", "priority", "confidence"):
        assert field in rec


def test_match_recommendations():
    resp = client.get("/api/v1/recommendations/match/match_1")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
    assert len(data) >= 1


def test_match_recommendations_not_found():
    resp = client.get("/api/v1/recommendations/match/fake_match")
    assert resp.status_code == 404


def test_player_recommendations():
    resp = client.get("/api/v1/recommendations/player/player_5")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)


def test_player_recommendations_not_found():
    resp = client.get("/api/v1/recommendations/player/ghost")
    assert resp.status_code == 404


def test_rule_based_fallback_no_model():
    """Recommendations must work even without a loaded ML model."""
    from app.services.model_runtime import model_runtime
    assert not model_runtime.is_loaded
    resp = client.get("/api/v1/recommendations")
    assert resp.status_code == 200
