import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine, SessionLocal

# Use a separate SQLite DB for tests
TEST_DB_URL = "sqlite:///./test_ptsmanager.db"
os.environ["DATABASE_URL"] = TEST_DB_URL

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Fresh DB per test (simple approach for now)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_signup_and_login():
    # Signup admin (allowed as first admin)
    resp = client.post("/api/users/", json={
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "StrongPass1",
        "role": "admin"
    })
    assert resp.status_code == 200, resp.text
    user = resp.json()
    assert user["email"] == "admin@example.com"

    # Login
    login = client.post("/api/auth/login", json={"email":"admin@example.com","password":"StrongPass1"})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    assert token

    # Get me
    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "admin@example.com"


def test_admin_guard_for_teacher_creation():
    # Create parent user (non-admin)
    r = client.post("/api/users/", json={
        "name": "Parent User",
        "email": "parent@example.com",
        "password": "StrongPass1",
        "role": "parent"
    })
    assert r.status_code == 200
    login = client.post("/api/auth/login", json={"email":"parent@example.com","password":"StrongPass1"})
    token = login.json()["access_token"]
    # Attempt teacher create (should 403)
    teacher_create = client.post("/api/teachers/", json={"user_id": 999, "subjects": []}, headers={"Authorization": f"Bearer {token}"})
    assert teacher_create.status_code == 403


def test_refresh_flow():
    # signup user
    r = client.post("/api/users/", json={"name":"User","email":"user1@example.com","password":"StrongPass1","role":"parent"})
    assert r.status_code == 200
    login = client.post("/api/auth/login", json={"email":"user1@example.com","password":"StrongPass1"})
    data = login.json()
    assert 'refresh_token' in data
    refresh_resp = client.post("/api/auth/refresh", json={"refresh_token": data['refresh_token']})
    assert refresh_resp.status_code == 200
    rotated = refresh_resp.json()
    assert rotated['access_token'] != data['access_token']
    assert rotated['refresh_token'] != data['refresh_token']


def test_login_rate_limit():
    # attempt invalid login multiple times
    for i in range(6):
        resp = client.post("/api/auth/login", json={"email":"missing@example.com","password":"x"})
    assert resp.status_code in (401, 429)
    if resp.status_code == 429:
        assert 'Too many attempts' in resp.text
