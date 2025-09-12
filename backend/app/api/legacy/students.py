from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Student, Class, Teacher, Parent, User
from app.schemas.schemas import StudentCreate, Student as StudentSchema
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/students", tags=["students"])

@router.post("/", response_model=StudentSchema)
def create_student(student: StudentCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.get("/", response_model=List[StudentSchema])
def list_students(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    with_meta: bool = Query(False, description="Return envelope with meta")
):
    query = db.query(Student)
    # Ownership scoping
    if user.role == 'parent':
        if user.parent:
            query = query.filter(Student.parent_id == user.parent.id)
        else:
            if with_meta:
                return {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit}}  # type: ignore
            return []
    elif user.role == 'teacher':
        if user.teacher:
            class_ids = [c.id for c in db.query(Class).filter(Class.teacher_id == user.teacher.id).all()]
            if class_ids:
                query = query.filter(Student.class_id.in_(class_ids))
            else:
                if with_meta:
                    return {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit}}  # type: ignore
                return []
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    if with_meta:
        # Return envelope (runtime type mismatch ignored for FastAPI schema but used by clients opting in)
        return {"data": items, "meta": {"total": total, "offset": offset, "limit": limit}}  # type: ignore
    return items

@router.patch("/{student_id}", response_model=StudentSchema)
async def update_student(student_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    st = db.query(Student).get(student_id)
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    for k,v in payload.items():
        if k in {"name","status","class_id","parent_id","email","roll_no"}:
            setattr(st, k, v)
    db.commit(); db.refresh(st)
    return st

@router.delete("/{student_id}")
async def delete_student(student_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    st = db.query(Student).get(student_id)
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(st); db.commit()
    return {"deleted": True}
