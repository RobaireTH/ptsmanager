import pytest
from httpx import AsyncClient
from app.main import app
from passlib.context import CryptContext
from app.db.prisma_client import prisma, init_prisma, close_prisma

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

@pytest.fixture(scope="session")
def event_loop():
    import asyncio
    loop = asyncio.get_event_loop()
    yield loop

@pytest.fixture(scope="session", autouse=True)
async def prisma_session():
    await init_prisma()
    yield
    await close_prisma()

@pytest.fixture(autouse=True)
async def clean_db():
    # Order matters (respect foreign keys)
    await prisma.result.delete_many()
    await prisma.message.delete_many()
    await prisma.student.delete_many()
    await prisma.classmodel.delete_many()
    await prisma.teacher.delete_many()
    await prisma.parent.delete_many()
    await prisma.event.delete_many()
    await prisma.user.delete_many()
    yield
    # post-test cleanup (optional duplicate safety)
    await prisma.result.delete_many()

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_signup_and_login(client):
    resp = await client.post("/api/users/", json={
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "StrongPass1",
        "role": "admin"
    })
    assert resp.status_code == 200, resp.text
    login = await client.post("/api/auth/login", json={"email":"admin@example.com","password":"StrongPass1"})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    me = await client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "admin@example.com"

@pytest.mark.asyncio
async def test_admin_guard_for_teacher_creation(client):
    r = await client.post("/api/users/", json={
        "name": "Parent User",
        "email": "parent@example.com",
        "password": "StrongPass1",
        "role": "parent"
    })
    assert r.status_code == 200
    login = await client.post("/api/auth/login", json={"email":"parent@example.com","password":"StrongPass1"})
    token = login.json()["access_token"]
    teacher_create = await client.post("/api/teachers/", json={"user_id": 999, "subjects": []}, headers={"Authorization": f"Bearer {token}"})
    assert teacher_create.status_code == 403

@pytest.mark.asyncio
async def test_refresh_flow(client):
    r = await client.post("/api/users/", json={"name":"User","email":"user1@example.com","password":"StrongPass1","role":"parent"})
    assert r.status_code == 200
    login = await client.post("/api/auth/login", json={"email":"user1@example.com","password":"StrongPass1"})
    data = login.json()
    refresh_resp = await client.post("/api/auth/refresh", json={"refresh_token": data['refresh_token']})
    assert refresh_resp.status_code == 200
    rotated = refresh_resp.json()
    assert rotated['access_token'] != data['access_token']
    assert rotated['refresh_token'] != data['refresh_token']

@pytest.mark.asyncio
async def test_login_rate_limit(client):
    last = None
    for _ in range(6):
        last = await client.post("/api/auth/login", json={"email":"missing@example.com","password":"x"})
    assert last is not None
    assert last.status_code in (401, 429)
    if last.status_code == 429:
        assert 'Too many attempts' in last.text
