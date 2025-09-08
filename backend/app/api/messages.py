from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.models import Message
from app.schemas.schemas import MessageCreate, Message as MessageSchema
from app.api.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=MessageSchema)
def create_message(message: MessageCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Derive sender_id from authenticated user for security
    db_message = Message(
        subject=message.subject,
        body=message.body,
        sender_id=user.id,
        recipient_role=message.recipient_role,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/", response_model=List[MessageSchema])
def list_messages(db: Session = Depends(get_db), user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    # Generic pagination pattern (apply to other list endpoints)
    return db.query(Message).offset(offset).limit(limit).all()
