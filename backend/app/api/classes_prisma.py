from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/classes", tags=["classes"])  # replacing legacy

class ClassCreate(BaseModel):
    name: str
    teacher_id: Optional[int] = None
    room: Optional[str] = None
    subjects: Optional[List[str]] = None
    expected_students: int = 0

class ClassOut(BaseModel):
    id: int
    name: str
    teacher_id: Optional[int]
    room: Optional[str]
    subjects: List[str] = []
    expected_students: int

@router.post("/", response_model=ClassOut)
async def create_class(payload: ClassCreate, user=Depends(require_role("admin"))):
    cls = await prisma.classmodel.create(data={
        'name': payload.name,
        'teacher_id': payload.teacher_id,
        'room': payload.room,
        'subjects': ",".join(payload.subjects) if payload.subjects else None,
        'expected_students': payload.expected_students,
    })
    subs = cls.subjects.split(',') if cls.subjects else []
    return ClassOut(id=cls.id, name=cls.name, teacher_id=cls.teacher_id, room=cls.room, subjects=subs, expected_students=cls.expected_students)

@router.get("/", response_model=List[ClassOut])
async def list_classes(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=100), with_meta: bool = Query(False)):
    where = {}
    if user.role == 'teacher' and user.teacher:
        where['teacher_id'] = user.teacher.id
    elif user.role == 'parent' and user.parent:
        # classes of their children
        children = await prisma.student.find_many(where={'parent_id': user.parent.id})
        class_ids = list({c.class_id for c in children if c.class_id})
        if class_ids:
            where['id'] = {'in': class_ids}
        else:
            return [] if not with_meta else {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit}}  # type: ignore
    total = await prisma.classmodel.count(where=where or None)
    classes = await prisma.classmodel.find_many(where=where or None, skip=offset, take=limit, order={'id': 'desc'})
    out = [ClassOut(id=c.id, name=c.name, teacher_id=c.teacher_id, room=c.room, subjects=c.subjects.split(',') if c.subjects else [], expected_students=c.expected_students) for c in classes]
    if with_meta:
        return {"data": out, "meta": {"total": total, "offset": offset, "limit": limit}}  # type: ignore
    return out

@router.patch("/{class_id}", response_model=ClassOut)
async def update_class(class_id: int, payload: dict, user=Depends(get_current_user)):
    cls = await prisma.classmodel.find_unique(where={'id': class_id})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    data = {}
    for k in ['name','teacher_id','room','expected_students']:
        if k in payload:
            data[k] = payload[k]
    if 'subjects' in payload and isinstance(payload['subjects'], list):
        data['subjects'] = ",".join(payload['subjects'])
    if data:
        cls = await prisma.classmodel.update(where={'id': class_id}, data=data)
    subs = cls.subjects.split(',') if cls.subjects else []
    return ClassOut(id=cls.id, name=cls.name, teacher_id=cls.teacher_id, room=cls.room, subjects=subs, expected_students=cls.expected_students)

@router.delete("/{class_id}")
async def delete_class(class_id: int, user=Depends(get_current_user)):
    cls = await prisma.classmodel.find_unique(where={'id': class_id})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    await prisma.classmodel.delete(where={'id': class_id})
    return {"deleted": True}
