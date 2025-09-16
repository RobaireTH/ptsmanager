from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from prisma import models

from app.db.prisma_client import prisma
from app.api.auth import get_current_user, get_current_user_or_dev
from pydantic import BaseModel

router = APIRouter(prefix="/messages", tags=["messages"])  # canonical path

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
async def list_messages(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=100)):
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


class BroadcastRequest(BaseModel):
    subject: str
    body: Optional[str] = None
    audience: str  # all_parents | all_teachers | class
    class_id: Optional[int] = None

@router.post("/broadcast")
async def broadcast_message(payload: BroadcastRequest, user=Depends(get_current_user_or_dev)):
    role = (getattr(user, 'role', '') or '').lower()
    if role != 'admin' and not (role == 'teacher' and payload.audience == 'class'):
        raise HTTPException(status_code=403, detail="Forbidden")

    recipients: List[int] = []
    if payload.audience == 'all_parents':
        parents = await prisma.parent.find_many()
        recipients = [p.user_id for p in parents]
    elif payload.audience == 'all_teachers':
        teachers = await prisma.teacher.find_many()
        recipients = [t.user_id for t in teachers]
    elif payload.audience == 'class':
        if not payload.class_id:
            raise HTTPException(status_code=400, detail="class_id is required for class audience")
        students = await prisma.student.find_many(where={'class_id': payload.class_id})
        parent_ids = {s.parent_id for s in students if s.parent_id}
        if parent_ids:
            parents = await prisma.parent.find_many(where={'id': {'in': list(parent_ids)}})
            recipients = [p.user_id for p in parents]
    else:
        raise HTTPException(status_code=400, detail="Invalid audience")

    created_ids: List[int] = []
    for uid in recipients:
        msg = await prisma.message.create(data={
            'subject': payload.subject,
            'body': payload.body,
            'sender_id': getattr(user, 'id', None),
            'recipient_id': uid,
            'recipient_role': 'parent' if payload.audience in ('all_parents','class') else 'teacher',
            'created_at': datetime.utcnow().isoformat(),
        })
        created_ids.append(msg.id)
        try:
            from app.api.websockets import manager
            import json
            await manager.send_personal_message(json.dumps({
                'id': msg.id,
                'subject': msg.subject,
                'body': msg.body,
                'sender_id': msg.sender_id,
                'recipient_id': msg.recipient_id,
                'recipient_role': msg.recipient_role,
                'created_at': msg.created_at,
                'read_at': msg.read_at,
            }), uid)
        except Exception:
            pass

    return {"sent": len(created_ids), "recipient_count": len(recipients)}


@router.get("/admin", response_model=List[MessageOut])
async def admin_list_messages(user=Depends(get_current_user_or_dev), offset: int = Query(0, ge=0), limit: int = Query(50, le=200)):
    if (getattr(user, 'role', '') or '').lower() != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
    msgs = await prisma.message.find_many(skip=offset, take=limit, order={'id': 'desc'})
    return [MessageOut(**m.dict()) for m in msgs]
