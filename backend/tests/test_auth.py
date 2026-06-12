"""
Tests: Auth system
Run: pytest tests/test_auth.py -v
Requires: test database running
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_register_patient():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpass123",
        })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "patient"


@pytest.mark.asyncio
async def test_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register first
        await client.post("/auth/register", json={
            "name": "Login Test",
            "email": "login@example.com",
            "password": "pass123",
        })
        # Login
        response = await client.post("/auth/login", json={
            "email": "login@example.com",
            "password": "pass123",
        })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/auth/login", json={
            "email": "login@example.com",
            "password": "wrongpass",
        })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        reg = await client.post("/auth/register", json={
            "name": "Me Test",
            "email": "me@example.com",
            "password": "pass123",
        })
        token = reg.json()["access_token"]
        response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
