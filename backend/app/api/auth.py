from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os, time, jwt, secrets, hashlib
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from app.db.prisma_client import prisma
from typing import Any

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"
ACCESS_EXP = int(os.getenv("ACCESS_TOKEN_TTL", "3600"))
REFRESH_EXP = int(os.getenv("REFRESH_TOKEN_TTL", str(60*60*24*14)))  # 14 days default
MAX_LOGIN_ATTEMPTS = int(os.getenv("LOGIN_RATE_ATTEMPTS", "5"))
LOGIN_WINDOW_SEC = int(os.getenv("LOGIN_RATE_WINDOW", "300"))

_login_attempts = {}  # ip -> [timestamps]

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class LoginRequest(BaseModel):
    email: str
    password: str

    @staticmethod
    def normalized_email(email: str) -> str:
        return (email or '').strip().lower()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str

router = APIRouter(prefix="/auth", tags=["auth"])
AUTH_DEV_MODE = os.getenv("AUTH_DEV_MODE", "true").lower() in ("1","true","yes")

def create_access_token(user_id: int):
    # include issued-at and a random jti to force uniqueness on rotation
    payload = {
        "sub": str(user_id),
        "exp": int(time.time()) + ACCESS_EXP,
        "iat": int(time.time()),
        "jti": secrets.token_hex(8)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def _hash_refresh(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

async def issue_refresh(user: Any):
    raw = secrets.token_urlsafe(48)
    await prisma.user.update(
        where={"id": user.id},
        data={
            "refresh_token_hash": _hash_refresh(raw),
            "refresh_token_expires_at": str(int(time.time()) + REFRESH_EXP)
        }
    )
    return raw

def validate_refresh(user: Any, token: str) -> bool:
    if not user.refresh_token_hash:
        return False
    try:
        if int(user.refresh_token_expires_at or 0) < int(time.time()):
            return False
    except ValueError:
        return False
    return _hash_refresh(token) == user.refresh_token_hash

async def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
        return await prisma.user.find_unique(where={"id": user_id})
    except Exception:
        return None

def _rate_limit(ip: str):
    now = time.time()
    bucket = _login_attempts.setdefault(ip, [])
    # prune
    cutoff = now - LOGIN_WINDOW_SEC
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= MAX_LOGIN_ATTEMPTS:
        return False, int(bucket[0] + LOGIN_WINDOW_SEC - now)
    bucket.append(now)
    return True, 0

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, ip: str = Depends(lambda: os.getenv('CLIENT_IP','local'))):
    allowed, retry_after = _rate_limit(ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Retry in {retry_after}s")
    email = LoginRequest.normalized_email(data.email)
    user = await prisma.user.find_unique(where={"email": email})
    if not user or not pwd_ctx.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if getattr(user, 'status', 'active') != 'active':
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token(user.id)
    refresh = await issue_refresh(user)
    return TokenResponse(access_token=token, refresh_token=refresh, expires_in=ACCESS_EXP)

class RequestEmail(BaseModel):
    email: str

class VerifyEmail(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest):
    hashed = _hash_refresh(payload.refresh_token)
    user = await prisma.user.find_first(where={"refresh_token_hash": hashed})
    if not user or not validate_refresh(user, payload.refresh_token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    new_refresh = await issue_refresh(user)
    access = create_access_token(user.id)
    return TokenResponse(access_token=access, refresh_token=new_refresh, expires_in=ACCESS_EXP)

@router.post("/request-email-verification")
async def request_email_verification(payload: RequestEmail):
    email = LoginRequest.normalized_email(payload.email)
    user = await prisma.user.find_unique(where={"email": email})
    if not user:
        return {"sent": True}
    token = secrets.token_urlsafe(32)
    await prisma.user.update(where={"id": user.id}, data={"email_verification_token": token, "email_verified": False})
    resp = {"sent": True}
    if AUTH_DEV_MODE:
        resp["verification_token"] = token
    return resp

@router.post("/verify-email")
async def verify_email(payload: VerifyEmail):
    user = await prisma.user.find_first(where={"email_verification_token": payload.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    await prisma.user.update(where={"id": user.id}, data={"email_verified": True, "email_verification_token": None})
    return {"verified": True}

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    email = LoginRequest.normalized_email(payload.email)
    user = await prisma.user.find_unique(where={"email": email})
    from datetime import datetime, timedelta
    if user:
        reset_token = secrets.token_urlsafe(32)
        expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        await prisma.user.update(where={"id": user.id}, data={"password_reset_token": reset_token, "password_reset_expires_at": expires})
        resp = {"sent": True}
        if AUTH_DEV_MODE:
            resp["reset_token"] = reset_token
        return resp
    return {"sent": True}

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    from datetime import datetime
    user = await prisma.user.find_first(where={"password_reset_token": payload.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    try:
        if user.password_reset_expires_at and datetime.utcnow() > datetime.fromisoformat(user.password_reset_expires_at):
            raise HTTPException(status_code=400, detail="Reset token expired")
    except ValueError:
        pass
    if not any(c.islower() for c in payload.new_password) or not any(c.isupper() for c in payload.new_password) or not any(c.isdigit() for c in payload.new_password) or len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 chars with lowercase, uppercase, and digits")
    await prisma.user.update(where={"id": user.id}, data={
        "password_hash": pwd_ctx.hash(payload.new_password),
        "password_reset_token": None,
        "password_reset_expires_at": None
    })
    return {"reset": True}

# Dependency
async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = await verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

def require_role(role: str):
    async def role_dependency(user: Any = Depends(get_current_user)):
        if user.role != role and user.role != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return role_dependency
