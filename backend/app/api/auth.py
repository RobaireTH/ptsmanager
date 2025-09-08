from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os, time, jwt, secrets, hashlib
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from app.db.session import get_db
from app.models.models import User

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

def issue_refresh(user: User, db: Session):
    raw = secrets.token_urlsafe(48)
    user.refresh_token_hash = _hash_refresh(raw)
    user.refresh_token_expires_at = str(int(time.time()) + REFRESH_EXP)
    db.commit()
    return raw

def validate_refresh(user: User, token: str) -> bool:
    if not user.refresh_token_hash:
        return False
    try:
        if int(user.refresh_token_expires_at or 0) < int(time.time()):
            return False
    except ValueError:
        return False
    return _hash_refresh(token) == user.refresh_token_hash

def verify_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
        user = db.query(User).get(user_id)
        return user
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
def login(data: LoginRequest, db: Session = Depends(get_db), ip: str = Depends(lambda: os.getenv('CLIENT_IP','local'))):
    allowed, retry_after = _rate_limit(ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Retry in {retry_after}s")
    email = LoginRequest.normalized_email(data.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_ctx.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if getattr(user, 'status', 'active') != 'active':
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token(user.id)
    refresh = issue_refresh(user, db)
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
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    # Find user by refresh hash
    hashed = _hash_refresh(payload.refresh_token)
    user = db.query(User).filter(User.refresh_token_hash == hashed).first()
    if not user or not validate_refresh(user, payload.refresh_token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    # rotate
    new_refresh = issue_refresh(user, db)
    access = create_access_token(user.id)
    return TokenResponse(access_token=access, refresh_token=new_refresh, expires_in=ACCESS_EXP)

@router.post("/request-email-verification")
def request_email_verification(payload: RequestEmail, db: Session = Depends(get_db)):
    email = LoginRequest.normalized_email(payload.email)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Do not leak existence; respond success
        return {"sent": True}
    import secrets
    user.email_verification_token = secrets.token_urlsafe(32)
    user.email_verified = False
    db.commit()
    resp = {"sent": True}
    if AUTH_DEV_MODE:
        resp["verification_token"] = user.email_verification_token
    return resp

@router.post("/verify-email")
def verify_email(payload: VerifyEmail, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    user.email_verified = True
    user.email_verification_token = None
    db.commit()
    return {"verified": True}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = LoginRequest.normalized_email(payload.email)
    user = db.query(User).filter(User.email == email).first()
    # Always respond success to avoid user enumeration
    import secrets
    from datetime import datetime, timedelta
    if user:
        user.password_reset_token = secrets.token_urlsafe(32)
        user.password_reset_expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        db.commit()
        resp = {"sent": True}
        if AUTH_DEV_MODE:
            resp["reset_token"] = user.password_reset_token
        return resp
    return {"sent": True}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    user = db.query(User).filter(User.password_reset_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    # Check expiry
    try:
        if user.password_reset_expires_at and datetime.utcnow() > datetime.fromisoformat(user.password_reset_expires_at):
            raise HTTPException(status_code=400, detail="Reset token expired")
    except ValueError:
        pass
    # Enforce password policy similar to backend
    if not any(c.islower() for c in payload.new_password) or not any(c.isupper() for c in payload.new_password) or not any(c.isdigit() for c in payload.new_password) or len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 chars with lowercase, uppercase, and digits")
    # Set new password
    user.password_hash = pwd_ctx.hash(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.commit()
    return {"reset": True}

# Dependency
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = verify_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

def require_role(role: str):
    async def role_dependency(user: User = Depends(get_current_user)):
        if user.role != role and user.role != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return role_dependency
