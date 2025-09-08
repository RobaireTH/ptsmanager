from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Class
from app.schemas.schemas import ClassCreate, Class as ClassSchema
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/classes", tags=["classes"])

@router.post("/", response_model=ClassSchema)
def create_class(class_: ClassCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    db_class = Class(name=class_.name, teacher_id=class_.teacher_id, room=class_.room, subjects=",".join(class_.subjects or []), expected_students=class_.expected_students)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.get("/", response_model=List[ClassSchema])
def list_classes(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    with_meta: bool = Query(False, description="Return envelope with meta")
):
    query = db.query(Class)
    if user.role == 'teacher' and user.teacher:
        query = query.filter(Class.teacher_id == user.teacher.id)
    elif user.role == 'parent' and user.parent:
        # Parent sees classes of their students
        from app.models.models import Student
        student_class_ids = [cid for (cid,) in db.query(Student.class_id).filter(Student.parent_id == user.parent.id).distinct() if cid]
        if student_class_ids:
            query = query.filter(Class.id.in_(student_class_ids))
        else:
            if with_meta:
                return {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit}}  # type: ignore
            return []
    total = query.count()
    classes = query.offset(offset).limit(limit).all()
    for c in classes:
        c.subjects = c.subjects.split(",") if c.subjects else []
    if with_meta:
        return {"data": classes, "meta": {"total": total, "offset": offset, "limit": limit}}  # type: ignore
    return classes

@router.patch("/{class_id}", response_model=ClassSchema)
async def update_class(class_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Class).get(class_id)
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    if 'subjects' in payload and isinstance(payload['subjects'], list):
        payload['subjects'] = ",".join(payload['subjects'])
    for k,v in payload.items():
        if k in {"name","teacher_id","room","subjects","expected_students"}:
            setattr(c, k, v)
    db.commit(); db.refresh(c)
    if c.subjects:
        c.subjects = c.subjects.split(',')
    return c

@router.delete("/{class_id}")
async def delete_class(class_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Class).get(class_id)
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(c); db.commit()
    return {"deleted": True}
