from fastapi import APIRouter, HTTPException, Depends, Query
from passlib.context import CryptContext
from prisma.models import User
from prisma import errors
from app.db.prisma_client import prisma
from typing import List
import secrets

router = APIRouter(prefix="/users2", tags=["users-prisma"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def ensure_connected():
    if not prisma.is_connected():
        await prisma.connect()

@router.post("/", response_model=dict)
async def create_user(name: str, email: str, password: str, role: str):
    await ensure_connected()
    if role not in {"teacher","parent","admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = await prisma.user.find_unique(where={"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    verification_token = secrets.token_urlsafe(32)
    user = await prisma.user.create(data={
        "name": name.strip(),
        "email": email,
        "role": role,
        "password_hash": pwd_ctx.hash(password),
        "status": "active",
        "email_verified": False,
        "email_verification_token": verification_token,
    })
    return {"id": user.id, "email": user.email, "role": user.role}

@router.get("/", response_model=List[dict])
async def list_users(offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    await ensure_connected()
    users = await prisma.user.find_many(skip=offset, take=limit)
    return [ {"id": u.id, "email": u.email, "name": u.name, "role": u.role} for u in users ]
