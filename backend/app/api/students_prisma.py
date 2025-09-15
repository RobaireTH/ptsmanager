from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Union, Any
from pydantic import BaseModel
from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/students", tags=["students"])

class StudentCreate(BaseModel):
    name: str
    class_id: Optional[int] = None
    roll_no: Optional[str] = None
    parent_id: Optional[int] = None
    email: Optional[str] = None

class StudentOut(BaseModel):
    id: int
    name: str
    class_id: Optional[int]
    roll_no: Optional[str]
    parent_id: Optional[int]
    email: Optional[str]
    status: str
    class Config:
        orm_mode = True

@router.post("/", response_model=StudentOut)
async def create_student(payload: StudentCreate, user=Depends(require_role("admin"))):
    st = await prisma.student.create(data=payload.dict())
    return StudentOut(**st.dict())

@router.get("/", response_model=List[StudentOut])
async def list_students(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=100), with_meta: bool = Query(False)):
    where: dict = {}
    if user.role == 'parent' and user.parent:
        where['parent_id'] = user.parent.id
    elif user.role == 'teacher' and user.teacher:
        # get classes for teacher
        classes = await prisma.classmodel.find_many(where={'teacher_id': user.teacher.id})  # class is reserved python word in prisma client => classmodel
        class_ids = [c.id for c in classes]
        if class_ids:
            where['class_id'] = {'in': class_ids}
        else:
            return [] if not with_meta else {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit}}  # type: ignore
    total = await prisma.student.count(where=where or None)
    students = await prisma.student.find_many(where=where or None, skip=offset, take=limit, order={'id': 'desc'})
    data = [StudentOut(**s.dict()) for s in students]
    if with_meta:
        return {"data": data, "meta": {"total": total, "offset": offset, "limit": limit}}  # type: ignore
    return data

@router.patch("/{student_id}", response_model=StudentOut)
async def update_student(student_id: int, payload: dict, user=Depends(get_current_user)):
    st = await prisma.student.find_unique(where={'id': student_id})
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    data = {k: v for k, v in payload.items() if k in {"name","status","class_id","parent_id","email","roll_no"}}
    if data:
        st = await prisma.student.update(where={'id': student_id}, data=data)
    return StudentOut(**st.dict())

@router.delete("/{student_id}")
async def delete_student(student_id: int, user=Depends(get_current_user)):
    st = await prisma.student.find_unique(where={'id': student_id})
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    await prisma.student.delete(where={'id': student_id})
    return {"deleted": True}
