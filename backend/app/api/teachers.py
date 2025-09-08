from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Teacher
from app.schemas.schemas import TeacherCreate, Teacher as TeacherSchema
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/teachers", tags=["teachers"])

@router.post("/", response_model=TeacherSchema)
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    db_teacher = Teacher(
        user_id=teacher.user_id,
        phone=teacher.phone,
        subjects=",".join(teacher.subjects or []),
        status=teacher.status or "active"
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.get("/", response_model=List[TeacherSchema])
def list_teachers(db: Session = Depends(get_db), user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    teachers = db.query(Teacher).offset(offset).limit(limit).all()
    for t in teachers:
        t.subjects = t.subjects.split(",") if t.subjects else []
    return teachers

@router.patch("/{teacher_id}", response_model=TeacherSchema)
async def update_teacher(teacher_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(Teacher).get(teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if 'subjects' in payload and isinstance(payload['subjects'], list):
        payload['subjects'] = ",".join(payload['subjects'])
    for k,v in payload.items():
        if k in {"phone","subjects","status"}:
            setattr(t, k, v)
    db.commit(); db.refresh(t)
    if t.subjects:
        t.subjects = t.subjects.split(',')
    return t

@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(Teacher).get(teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(t); db.commit()
    return {"deleted": True}
