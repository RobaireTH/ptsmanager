from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/teachers", tags=["teachers"])

class TeacherCreate(BaseModel):
    user_id: int
    phone: Optional[str] = None
    subjects: Optional[List[str]] = None
    status: Optional[str] = "active"

class TeacherOut(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    subjects: List[str] = []
    status: str
    class Config:
        from_attributes = True

@router.post("/", response_model=TeacherOut)
async def create_teacher(payload: TeacherCreate, user=Depends(require_role("admin"))):
    existing = await prisma.teacher.find_unique(where={"user_id": payload.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Teacher already exists for user")
    teacher = await prisma.teacher.create(data={
        "user_id": payload.user_id,
        "phone": payload.phone,
        "subjects": ",".join(payload.subjects) if payload.subjects else None,
        "status": payload.status or "active"
    })
    subs = teacher.subjects.split(',') if teacher.subjects else []
    return TeacherOut(id=teacher.id, user_id=teacher.user_id, phone=teacher.phone, subjects=subs, status=teacher.status)

@router.get("/", response_model=List[TeacherOut])
async def list_teachers(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    teachers = await prisma.teacher.find_many(skip=offset, take=limit, order={"id": "desc"})
    out: List[TeacherOut] = []
    for t in teachers:
        subs = t.subjects.split(',') if t.subjects else []
        out.append(TeacherOut(id=t.id, user_id=t.user_id, phone=t.phone, subjects=subs, status=t.status))
    return out

@router.patch("/{teacher_id}", response_model=TeacherOut)
async def update_teacher(teacher_id: int, payload: dict, user=Depends(get_current_user)):
    t = await prisma.teacher.find_unique(where={"id": teacher_id})
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    data = {}
    if 'phone' in payload:
        data['phone'] = payload['phone']
    if 'status' in payload:
        data['status'] = payload['status']
    if 'subjects' in payload and isinstance(payload['subjects'], list):
        data['subjects'] = ",".join(payload['subjects'])
    if data:
        t = await prisma.teacher.update(where={"id": teacher_id}, data=data)
    subs = t.subjects.split(',') if t.subjects else []
    return TeacherOut(id=t.id, user_id=t.user_id, phone=t.phone, subjects=subs, status=t.status)

@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: int, user=Depends(get_current_user)):
    t = await prisma.teacher.find_unique(where={"id": teacher_id})
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    await prisma.teacher.delete(where={"id": teacher_id})
    return {"deleted": True}


# Admin-only utility endpoints to ensure a teacher profile exists for a user
class EnsureTeacherPayload(BaseModel):
    user_id: int

class EnsureTeacherByEmailPayload(BaseModel):
    email: EmailStr

@router.post("/ensure", response_model=dict)
async def ensure_teacher_profile(payload: EnsureTeacherPayload, admin=Depends(require_role("admin"))):
    u = await prisma.user.find_unique(where={"id": payload.user_id})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if (u.role or "").lower() != "teacher":
        raise HTTPException(status_code=400, detail="User is not a teacher")
    existing = await prisma.teacher.find_first(where={"user_id": payload.user_id})
    if existing:
        return {"id": existing.id, "user_id": existing.user_id}
    created = await prisma.teacher.create(data={"user_id": payload.user_id, "status": "active"})
    return {"id": created.id, "user_id": created.user_id}

@router.post("/ensure-by-email", response_model=dict)
async def ensure_teacher_profile_by_email(payload: EnsureTeacherByEmailPayload, admin=Depends(require_role("admin"))):
    email = str(payload.email).strip().lower()
    u = await prisma.user.find_unique(where={"email": email})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if (u.role or "").lower() != "teacher":
        raise HTTPException(status_code=400, detail="User is not a teacher")
    existing = await prisma.teacher.find_first(where={"user_id": u.id})
    if existing:
        return {"id": existing.id, "user_id": existing.user_id}
    created = await prisma.teacher.create(data={"user_id": u.id, "status": "active"})
    return {"id": created.id, "user_id": created.user_id}

# New endpoint to create teacher with user creation
class CreateTeacherWithUserPayload(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subjects: Optional[List[str]] = None
    password: Optional[str] = None
    classId: Optional[int] = None

@router.post("/create-with-user", response_model=TeacherOut)
async def create_teacher_with_user(payload: CreateTeacherWithUserPayload):
    email = str(payload.email).strip().lower()
    
    # Check if user already exists
    existing_user = await prisma.user.find_unique(where={"email": email})
    if existing_user:
        # If user exists and is already a teacher, just ensure teacher profile exists
        if (existing_user.role or "").lower() == "teacher":
            teacher = await prisma.teacher.find_first(where={"user_id": existing_user.id})
            if teacher:
                # Update existing teacher profile
                if payload.phone or payload.subjects:
                    update_data = {}
                    if payload.phone:
                        update_data["phone"] = payload.phone
                    if payload.subjects:
                        update_data["subjects"] = ",".join(payload.subjects)
                    teacher = await prisma.teacher.update(where={"id": teacher.id}, data=update_data)
                subs = teacher.subjects.split(',') if teacher.subjects else []
                return TeacherOut(id=teacher.id, user_id=teacher.user_id, phone=teacher.phone, subjects=subs, status=teacher.status)
            else:
                # Create teacher profile for existing user
                teacher = await prisma.teacher.create(data={"user_id": existing_user.id, "status": "active"})
                subs = teacher.subjects.split(',') if teacher.subjects else []
                return TeacherOut(id=teacher.id, user_id=teacher.user_id, phone=teacher.phone, subjects=subs, status=teacher.status)
        else:
            raise HTTPException(status_code=400, detail="User exists but is not a teacher")
    
    # Create new user
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = await prisma.user.create(data={
        "name": payload.name.strip(),
        "email": email,
        "role": "teacher",
        "password_hash": pwd_ctx.hash(payload.password or "TempPass123!"),
        "status": "active",
        "email_verified": True,  # Admin-created accounts are pre-verified
    })
    
    # Create teacher profile
    teacher = await prisma.teacher.create(data={
        "user_id": user.id,
        "phone": payload.phone,
        "subjects": ",".join(payload.subjects) if payload.subjects else None,
        "status": "active"
    })
    
    # Assign class if provided
    if payload.classId:
        # Check if class exists and is not already assigned
        existing_class = await prisma.classmodel.find_unique(where={"id": payload.classId})
        if existing_class:
            if existing_class.teacher_id is not None:
                raise HTTPException(status_code=400, detail="Class is already assigned to another teacher")
            # Assign class to teacher
            await prisma.classmodel.update(where={"id": payload.classId}, data={"teacher_id": teacher.id})
    
    subs = teacher.subjects.split(',') if teacher.subjects else []
    return TeacherOut(id=teacher.id, user_id=teacher.user_id, phone=teacher.phone, subjects=subs, status=teacher.status)
