from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.models import Message
from app.schemas.schemas import MessageCreate, Message as MessageSchema
from app.api.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

from app.api.websockets import manager
import json

# ... (rest of the file)

@router.post("/", response_model=MessageSchema)
async def create_message(message: MessageCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Derive sender_id from authenticated user for security
    db_message = Message(
        subject=message.subject,
        body=message.body,
        sender_id=user.id,
        recipient_id=message.recipient_id,
        recipient_role=message.recipient_role,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Send real-time message
    # Build payload once
    message_dict = {
        "id": db_message.id,
        "subject": db_message.subject,
        "body": db_message.body,
        "sender_id": db_message.sender_id,
        "recipient_id": db_message.recipient_id,
        "recipient_role": db_message.recipient_role,
        "created_at": db_message.created_at,
        "read_at": db_message.read_at
    }
    # Send to recipient if specified
    if db_message.recipient_id:
        await manager.send_personal_message(json.dumps(message_dict), db_message.recipient_id)
    # Echo back to sender (avoid double-send if sender == recipient)
    if db_message.sender_id != db_message.recipient_id:
        await manager.send_personal_message(json.dumps(message_dict), db_message.sender_id)

    return db_message

@router.get("/", response_model=List[MessageSchema])
def list_messages(db: Session = Depends(get_db), user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    # Generic pagination pattern (apply to other list endpoints)
    return db.query(Message).filter(
        (Message.sender_id == user.id) | (Message.recipient_id == user.id)
    ).offset(offset).limit(limit).all()
