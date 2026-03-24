from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import user_store

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_users(monkeypatch, tmp_path):
    """Ensure tests run with an isolated, empty users.json file."""
    monkeypatch.setattr(user_store, "_USERS_FILE", tmp_path / "users.json")
    user_store._load_raw.cache_clear() if hasattr(user_store._load_raw, "cache_clear") else None
    yield

def test_register_success():
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": "test@example.com", "password": "password123"}
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert "accessToken" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"
    assert data["user"]["plan"] == "Active Member"

def test_register_duplicate_email():
    payload = {"name": "Test User", "email": "test@example.com", "password": "password123"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "CONFLICT"

def test_login_success():
    payload = {"name": "Log In User", "email": "login@example.com", "password": "securepassword"}
    client.post("/api/v1/auth/register", json=payload)
    
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "securepassword"}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "accessToken" in data

def test_login_invalid_password():
    payload = {"name": "Log In User", "email": "login@example.com", "password": "securepassword"}
    client.post("/api/v1/auth/register", json=payload)
    
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "wrongpassword"}
    )
    assert resp.status_code == 401
    assert resp.json()["error_code"] == "UNAUTHORIZED"

def test_get_me_success():
    # Register and get token
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Me User", "email": "me@example.com", "password": "password123"}
    )
    token = reg_resp.json()["data"]["accessToken"]
    
    # Use token to call /me
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    data = me_resp.json()["data"]
    assert data["email"] == "me@example.com"
    assert data["name"] == "Me User"

def test_get_me_invalid_token():
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.valid.jwt"}
    )
    assert resp.status_code == 401

def test_get_me_missing_token():
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401  # manual exception raised now
