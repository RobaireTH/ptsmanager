from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Event
from app.schemas.schemas import EventCreate, Event as EventSchema
from app.api.auth import get_current_user, require_role

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=EventSchema)
def create_event(event: EventCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    db_event = Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[EventSchema])
def list_events(db: Session = Depends(get_db), user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    return db.query(Event).offset(offset).limit(limit).all()

@router.patch("/{event_id}", response_model=EventSchema)
async def update_event(event_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Event).get(event_id)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    for k,v in payload.items():
        if k in {"title","description","date","time","type","status"}:
            setattr(e, k, v)
    db.commit(); db.refresh(e)
    return e

@router.delete("/{event_id}")
async def delete_event(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Event).get(event_id)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(e); db.commit()
    return {"deleted": True}
