from fastapi import APIRouter, HTTPException, Depends, Query
from passlib.context import CryptContext
from app.db.prisma_client import prisma
from typing import List, Optional
import secrets
from pydantic import BaseModel, EmailStr
from app.api.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str
    email_verified: bool

async def ensure_connected():
    if not prisma.is_connected():
        await prisma.connect()

@router.post("/", response_model=UserOut)
async def create_user(payload: UserCreate):
    await ensure_connected()
    role = payload.role.strip().lower()
    if role not in {"teacher","parent","admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    email = str(payload.email).strip().lower()
    existing = await prisma.user.find_unique(where={"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    verification_token = secrets.token_urlsafe(32)
    user = await prisma.user.create(data={
        "name": payload.name.strip(),
        "email": email,
        "role": role,
        "password_hash": pwd_ctx.hash(payload.password),
        "status": "active",
        "email_verified": False,
        "email_verification_token": verification_token,
    })
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        status=user.status,
        email_verified=bool(user.email_verified),
    )

@router.get("/", response_model=List[UserOut])
async def list_users(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    _user=Depends(get_current_user),
):
    await ensure_connected()
    items = await prisma.user.find_many(skip=offset, take=limit, order={"id":"desc"})
    return [
        UserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            status=u.status,
            email_verified=bool(u.email_verified),
        ) for u in items
    ]

@router.get("/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        status=getattr(user, "status", "active"),
        email_verified=bool(getattr(user, "email_verified", False)),
    )

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: int, payload: UserUpdate, current=Depends(get_current_user)):
    await ensure_connected()
    # allow self or admin
    if current.role != "admin" and current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    data = {k: v for k, v in payload.dict(exclude_unset=True).items() if k in {"name","role","status"}}
    if not data:
        u = await prisma.user.find_unique(where={"id": user_id})
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        return UserOut(id=u.id, name=u.name, email=u.email, role=u.role, status=u.status, email_verified=bool(u.email_verified))
    u = await prisma.user.update(where={"id": user_id}, data=data)
    return UserOut(id=u.id, name=u.name, email=u.email, role=u.role, status=u.status, email_verified=bool(u.email_verified))

@router.delete("/{user_id}")
async def delete_user(user_id: int, current=Depends(get_current_user)):
    await ensure_connected()
    if current.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    u = await prisma.user.find_unique(where={"id": user_id})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    await prisma.user.delete(where={"id": user_id})
    return {"deleted": True}
