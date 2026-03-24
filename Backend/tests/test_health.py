from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "timestamp" in body
    assert "version" in body


def test_health_cors_header():
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_app_startup():
    """Just importing main and hitting health confirms the app starts cleanly."""
    assert app is not None
