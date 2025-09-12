from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Parent
from app.schemas.schemas import ParentCreate, Parent as ParentSchema
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/parents", tags=["parents"])

@router.post("/", response_model=ParentSchema)
def create_parent(parent: ParentCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    db_parent = Parent(**parent.dict())
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    return db_parent

@router.get("/", response_model=List[ParentSchema])
def list_parents(db: Session = Depends(get_db), user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    return db.query(Parent).offset(offset).limit(limit).all()

@router.patch("/{parent_id}", response_model=ParentSchema)
async def update_parent(parent_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Parent).get(parent_id)
    if not p:
        raise HTTPException(status_code=404, detail="Parent not found")
    for k,v in payload.items():
        if k in {"phone","profile_picture_url"}:
            setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p

@router.delete("/{parent_id}")
async def delete_parent(parent_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Parent).get(parent_id)
    if not p:
        raise HTTPException(status_code=404, detail="Parent not found")
    db.delete(p); db.commit()
    return {"deleted": True}
