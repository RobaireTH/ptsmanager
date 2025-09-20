from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import time
from pydantic import BaseModel
from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/results", tags=["results"])

# Helpers

def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

class ResultCreate(BaseModel):
    student_id: int
    class_id: Optional[int] = None
    subject: str
    term: str
    score: int
    grade: str
    date: Optional[str] = None
    comments: Optional[str] = None

class ResultUpdate(BaseModel):
    subject: Optional[str] = None
    term: Optional[str] = None
    score: Optional[int] = None
    grade: Optional[str] = None
    date: Optional[str] = None
    comments: Optional[str] = None

class ResultOut(BaseModel):
    id: int
    student_id: int
    class_id: Optional[int]
    teacher_id: int
    subject: str
    term: str
    score: int
    grade: str
    date: Optional[str]
    comments: Optional[str]
    created_at: Optional[str]

@router.post("/", response_model=ResultOut)
async def create_result(payload: ResultCreate, user=Depends(require_role("teacher"))):
    # Ensure teacher profile exists
    if not user.teacher:
        raise HTTPException(status_code=403, detail="Teacher profile not found. Please contact admin.")
    
    # teacher must own class of student
    st = await prisma.student.find_unique(where={'id': payload.student_id})
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")
    cls = None
    if st.class_id:
        cls = await prisma.classmodel.find_unique(where={'id': st.class_id})
    if not cls or cls.teacher_id != user.teacher.id:
        raise HTTPException(status_code=403, detail="Not allowed to post results for this student")
    res = await prisma.result.create(data={
        'student_id': payload.student_id,
        'class_id': payload.class_id or st.class_id,
        'teacher_id': user.teacher.id,
        'subject': payload.subject.strip(),
        'term': payload.term.strip(),
        'score': payload.score,
        'grade': payload.grade.strip(),
        'date': payload.date,
        'comments': payload.comments,
        'created_at': _now_iso(),
    })
    return ResultOut(**res.dict())

@router.get("/", response_model=List[ResultOut])
async def list_results(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=200), student_id: Optional[int] = None, term: Optional[str] = None):
    where: dict = {}
    if user.role == 'teacher' and user.teacher:
        classes = await prisma.classmodel.find_many(where={'teacher_id': user.teacher.id})
        cls_ids = [c.id for c in classes]
        if cls_ids:
            where['class_id'] = {'in': cls_ids}
        else:
            return []
    elif user.role == 'parent' and user.parent:
        children = await prisma.student.find_many(where={'parent_id': user.parent.id})
        ch_ids = [c.id for c in children]
        if ch_ids:
            where['student_id'] = {'in': ch_ids}
        else:
            return []
    # admin sees all
    if student_id is not None:
        where['student_id'] = student_id
    if term is not None and term.strip():
        where['term'] = term.strip()
    res = await prisma.result.find_many(where=where or None, skip=offset, take=limit, order={'id': 'desc'})
    return [ResultOut(**r.dict()) for r in res]

@router.get("/admin/teacher-performance", response_model=dict)
async def teacher_performance(user=Depends(get_current_user_or_dev)):
    if (getattr(user, 'role', '') or '').lower() != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    # Basic metric: average score per teacher across all results
    results = await prisma.result.find_many()
    from collections import defaultdict
    totals = defaultdict(lambda: {"sum": 0, "count": 0})
    for r in results:
        totals[r.teacher_id]["sum"] += r.score
        totals[r.teacher_id]["count"] += 1
    averages = {str(tid): round(v["sum"]/v["count"], 2) if v["count"] else 0 for tid, v in totals.items()}
    return {"averages": averages, "teacher_count": len(averages)}

@router.patch("/{result_id}", response_model=ResultOut)
async def update_result(result_id: int, payload: ResultUpdate, user=Depends(get_current_user)):
    res = await prisma.result.find_unique(where={'id': result_id})
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    # Authorization
    if user.role == 'teacher' and user.teacher:
        st = await prisma.student.find_unique(where={'id': res.student_id})
        if not st or not st.class_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        cls = await prisma.classmodel.find_unique(where={'id': st.class_id})
        if not cls or cls.teacher_id != user.teacher.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    if data:
        res = await prisma.result.update(where={'id': result_id}, data=data)
    return ResultOut(**res.dict())

@router.delete("/{result_id}")
async def delete_result(result_id: int, user=Depends(get_current_user)):
    res = await prisma.result.find_unique(where={'id': result_id})
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    if user.role == 'teacher' and user.teacher:
        st = await prisma.student.find_unique(where={'id': res.student_id})
        if not st or not st.class_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        cls = await prisma.classmodel.find_unique(where={'id': st.class_id})
        if not cls or cls.teacher_id != user.teacher.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    await prisma.result.delete(where={'id': result_id})
    return {"deleted": True}
