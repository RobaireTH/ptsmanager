from fastapi import APIRouter, Request, Header
from typing import Optional

router = APIRouter(prefix="/webhook", tags=["webhook"])

@router.post("/")
async def receive_generic_webhook(
    request: Request,
    x_event_key: Optional[str] = Header(None, alias="X-Event-Key"),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    payload = await request.json()
    # For now, just acknowledge. Extend here for provider-specific handling.
    return {
        "received": True,
        "event": x_event_key,
        "signature": bool(x_signature),
        "size": len(str(payload))
    }


