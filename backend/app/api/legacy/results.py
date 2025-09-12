from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import time

from app.db.session import get_db
from app.models.models import Result, Student, Class, Teacher
from app.schemas.schemas import Result as ResultSchema, ResultCreate, ResultUpdate
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/results", tags=["results"])

# Helpers

def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _teacher_can_access_student(db: Session, teacher_id: int, student: Student) -> bool:
    if not student.class_id:
        return False
    cls: Optional[Class] = db.query(Class).get(student.class_id)
    if not cls:
        return False
    return cls.teacher_id == teacher_id


@router.post("/", response_model=ResultSchema)
async def create_result(payload: ResultCreate, db: Session = Depends(get_db), user=Depends(require_role("teacher"))):
    # Ensure teacher can post for this student (must be this student's class teacher)
    st = db.query(Student).get(payload.student_id)
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    if not _teacher_can_access_student(db, user.teacher.id, st):
        raise HTTPException(status_code=403, detail="Not allowed to post results for this student")

    db_res = Result(
        student_id=payload.student_id,
        class_id=payload.class_id or st.class_id,
        teacher_id=user.teacher.id,
        subject=payload.subject.strip(),
        term=payload.term.strip(),
        score=payload.score,
        grade=payload.grade.strip(),
        date=payload.date,
        comments=payload.comments,
        created_at=_now_iso(),
    )
    db.add(db_res)
    db.commit(); db.refresh(db_res)
    return db_res


@router.get("/", response_model=List[ResultSchema])
async def list_results(db: Session = Depends(get_db), user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=200), student_id: Optional[int] = None, term: Optional[str] = None):
    q = db.query(Result)
    # Scoping by role
    if user.role == 'teacher' and user.teacher:
        # Only results for classes taught by this teacher
        class_ids = [c.id for c in db.query(Class).filter(Class.teacher_id == user.teacher.id).all()]
        if class_ids:
            q = q.filter(Result.class_id.in_(class_ids))
        else:
            return []
    elif user.role == 'parent' and user.parent:
        # Only results for this parent's children
        child_ids = [s.id for s in db.query(Student).filter(Student.parent_id == user.parent.id).all()]
        if child_ids:
            q = q.filter(Result.student_id.in_(child_ids))
        else:
            return []
    else:
        # admin or other roles see all
        pass

    if student_id is not None:
        q = q.filter(Result.student_id == student_id)
    if term is not None and term.strip():
        q = q.filter(Result.term == term.strip())

    return q.offset(offset).limit(limit).all()


@router.patch("/{result_id}", response_model=ResultSchema)
async def update_result(result_id: int, payload: ResultUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    res = db.query(Result).get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")

    # Authorization: admin or teacher of the student's class
    if user.role == 'teacher' and user.teacher:
        st = db.query(Student).get(res.student_id)
        if not _teacher_can_access_student(db, user.teacher.id, st):
            raise HTTPException(status_code=403, detail="Forbidden")
    elif user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(res, k, v)
    db.commit(); db.refresh(res)
    return res


@router.delete("/{result_id}")
async def delete_result(result_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    res = db.query(Result).get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")

    # Authorization
    if user.role == 'teacher' and user.teacher:
        st = db.query(Student).get(res.student_id)
        if not _teacher_can_access_student(db, user.teacher.id, st):
            raise HTTPException(status_code=403, detail="Forbidden")
    elif user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(res); db.commit()
    return {"deleted": True}

