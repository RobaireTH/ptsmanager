from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, User as UserSchema
from typing import List
from passlib.context import CryptContext
from app.api.auth import get_current_user
import os, secrets

router = APIRouter(prefix="/users", tags=["users"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Restrict roles for public signup; allow first admin bootstrap only if none exists
    if user.role not in {"teacher", "parent", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    if user.role == "admin":
        existing_admin = db.query(User).filter(User.role == "admin").first()
        if existing_admin:
            raise HTTPException(status_code=403, detail="Admin signup is not allowed")
    # Uniqueness (case-normalized by schema)
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    password_hash = pwd_ctx.hash(user.password)
    verification_token = secrets.token_urlsafe(32)
    db_user = User(
        name=user.name.strip(),
        email=user.email,
        role=user.role,
        password_hash=password_hash,
        status="active",
        email_verified=False,
        email_verification_token=verification_token,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserSchema])
def list_users(db: Session = Depends(get_db), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    return db.query(User).offset(offset).limit(limit).all()

@router.get("/me", response_model=UserSchema)
async def get_me(current: User = Depends(get_current_user)):
    return current

@router.patch("/{user_id}", response_model=UserSchema)
async def update_user(user_id: int, payload: dict, db: Session = Depends(get_db), current=Depends(get_current_user)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for k,v in payload.items():
        if k in {"name","role","status"}:
            setattr(user, k, v)
    db.commit(); db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), current=Depends(get_current_user)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()
    return {"deleted": True}
