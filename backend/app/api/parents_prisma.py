from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/parents", tags=["parents"])

class ParentCreate(BaseModel):
    user_id: int
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None

class ParentOut(BaseModel):
    id: int
    user_id: int
    phone: Optional[str]
    profile_picture_url: Optional[str]
    class Config:
        orm_mode = True

@router.post("/", response_model=ParentOut)
async def create_parent(payload: ParentCreate, user=Depends(require_role("admin"))):
    existing = await prisma.parent.find_unique(where={"user_id": payload.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Parent already exists for user")
    parent = await prisma.parent.create(data=payload.dict())
    return ParentOut(**parent.dict())

@router.get("/", response_model=List[ParentOut])
async def list_parents(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    parents = await prisma.parent.find_many(skip=offset, take=limit, order={"id": "desc"})
    return [ParentOut(**p.dict()) for p in parents]

@router.get("/engagement/admin", response_model=dict)
async def parent_engagement_admin(user=Depends(get_current_user_or_dev)):
    if (getattr(user, 'role', '') or '').lower() != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    total_parents = await prisma.parent.count()
    # naive proxy: number of parents who have at least one student
    from prisma import Prisma
    linked = await prisma.student.count(where={"parent_id": {"not": None}})
    return {"total_parents": total_parents, "linked_parents": linked}

@router.patch("/{parent_id}", response_model=ParentOut)
async def update_parent(parent_id: int, payload: dict, user=Depends(get_current_user)):
    p = await prisma.parent.find_unique(where={"id": parent_id})
    if not p:
        raise HTTPException(status_code=404, detail="Parent not found")
    data = {k: v for k, v in payload.items() if k in {"phone", "profile_picture_url"}}
    if not data:
        return ParentOut(**p.dict())
    p = await prisma.parent.update(where={"id": parent_id}, data=data)
    return ParentOut(**p.dict())

@router.delete("/{parent_id}")
async def delete_parent(parent_id: int, user=Depends(get_current_user)):
    p = await prisma.parent.find_unique(where={"id": parent_id})
    if not p:
        raise HTTPException(status_code=404, detail="Parent not found")
    await prisma.parent.delete(where={"id": parent_id})
    return {"deleted": True}
