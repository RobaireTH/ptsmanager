import pytest
from httpx import AsyncClient
from fastapi import status
from app.main import app
from prisma import Prisma
import asyncio

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop

@pytest.fixture(scope="session", autouse=True)
async def prisma_client():
    from app.db.prisma_client import prisma, init_prisma, close_prisma
    await init_prisma()
    yield prisma
    await close_prisma()

@pytest.fixture
async def client(prisma_client):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

async def _create_user(prisma_client, name, email, role, password_hash):
    return await prisma_client.user.create(data={
        'name': name,
        'email': email,
        'role': role,
        'password_hash': password_hash,
        'status': 'active'
    })

@pytest.mark.asyncio
async def test_auth_login_and_refresh(client, prisma_client):
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = await _create_user(prisma_client, 'Admin', 'admin@test.local', 'admin', pwd.hash('Password1'))
    resp = await client.post('/api/auth/login', json={'email': user.email, 'password': 'Password1'})
    assert resp.status_code == 200, resp.text
    tokens = resp.json()
    assert 'access_token' in tokens
    r2 = await client.post('/api/auth/refresh', json={'refresh_token': tokens['refresh_token']})
    assert r2.status_code == 200

@pytest.mark.asyncio
async def test_create_and_list_class(client, prisma_client):
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    admin = await prisma_client.user.find_unique(where={'email': 'admin@test.local'})
    if not admin:
        admin = await _create_user(prisma_client, 'Admin', 'admin@test.local', 'admin', pwd.hash('Password1'))
    login = await client.post('/api/auth/login', json={'email': 'admin@test.local', 'password': 'Password1'})
    token = login.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    c_resp = await client.post('/api/classes', json={'name': 'JSS1', 'expected_students': 30}, headers=headers)
    assert c_resp.status_code == 200, c_resp.text
    l_resp = await client.get('/api/classes', headers=headers)
    assert l_resp.status_code == 200
    assert any(c['name'] == 'JSS1' for c in l_resp.json())
