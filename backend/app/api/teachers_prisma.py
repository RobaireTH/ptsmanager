from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.api.auth import get_current_user, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/teachers2", tags=["teachers-prisma"])

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
        orm_mode = True

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
async def list_teachers(user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
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
