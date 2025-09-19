from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma

router = APIRouter(prefix="/events", tags=["events"])  # replacing legacy

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: Optional[str]
    time: Optional[str]
    type: Optional[str]
    status: str

@router.post("/", response_model=EventOut)
async def create_event(payload: EventCreate, user=Depends(require_role("admin"))):
    # Ensure status is set if not provided
    event_data = payload.dict()
    if not event_data.get("status"):
        event_data["status"] = "scheduled"
    
    ev = await prisma.event.create(data=event_data)
    return EventOut(**ev.dict())

@router.get("/", response_model=List[EventOut])
async def list_events(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    events = await prisma.event.find_many(skip=offset, take=limit, order={'id': 'desc'})
    return [EventOut(**e.dict()) for e in events]

@router.patch("/{event_id}", response_model=EventOut)
async def update_event(event_id: int, payload: dict, user=Depends(get_current_user)):
    ev = await prisma.event.find_unique(where={'id': event_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    data = {k: v for k, v in payload.items() if k in {"title","description","date","time","type","status"}}
    if data:
        ev = await prisma.event.update(where={'id': event_id}, data=data)
    return EventOut(**ev.dict())

@router.delete("/{event_id}")
async def delete_event(event_id: int, user=Depends(get_current_user)):
    ev = await prisma.event.find_unique(where={'id': event_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    await prisma.event.delete(where={'id': event_id})
    return {"deleted": True}
