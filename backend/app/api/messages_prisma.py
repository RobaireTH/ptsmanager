from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from prisma import models

from app.db.prisma_client import prisma
from app.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/messages2", tags=["messages-prisma"])  # temporary incremental path

class MessageCreate(BaseModel):
    subject: str
    body: str
    recipient_id: Optional[int] = None
    recipient_role: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    subject: str
    body: str
    sender_id: int
    recipient_id: Optional[int]
    recipient_role: Optional[str]
    created_at: str
    read_at: Optional[str]

    class Config:
        orm_mode = True

@router.post("/", response_model=MessageOut)
async def create_message(payload: MessageCreate, user=Depends(get_current_user)):
    msg = await prisma.message.create(
        data={
            "subject": payload.subject,
            "body": payload.body,
            "sender_id": user.id,
            "recipient_id": payload.recipient_id,
            "recipient_role": payload.recipient_role,
            "created_at": datetime.utcnow().isoformat()
        }
    )
    # echo via websocket if manager available
    try:
        from app.api.websockets import manager
        import json
        message_dict = {
            "id": msg.id,
            "subject": msg.subject,
            "body": msg.body,
            "sender_id": msg.sender_id,
            "recipient_id": msg.recipient_id,
            "recipient_role": msg.recipient_role,
            "created_at": msg.created_at,
            "read_at": msg.read_at,
        }
        if msg.recipient_id:
            await manager.send_personal_message(json.dumps(message_dict), msg.recipient_id)
        if msg.sender_id != msg.recipient_id:
            await manager.send_personal_message(json.dumps(message_dict), msg.sender_id)
    except Exception:
        pass
    return MessageOut(**msg.dict())

@router.get("/", response_model=List[MessageOut])
async def list_messages(user=Depends(get_current_user), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
    msgs = await prisma.message.find_many(
        where={
            'OR': [
                {'sender_id': user.id},
                {'recipient_id': user.id}
            ]
        },
        skip=offset,
        take=limit,
        order={'id': 'desc'}
    )
    return [MessageOut(**m.dict()) for m in msgs]
