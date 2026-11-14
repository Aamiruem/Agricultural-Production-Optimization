"""Public contact form: messages are stored for the site owner (admins can list them)."""

from __future__ import annotations

import threading
import time
from collections import deque

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession
from app.db.models import ContactMessage

router = APIRouter(tags=["contact"])

# Simple per-IP throttle: at most 5 messages per 10 minutes.
_WINDOW_S, _LIMIT = 600, 5
_hits: dict[str, deque] = {}
_lock = threading.Lock()


def _throttled(ip: str) -> bool:
    now = time.monotonic()
    with _lock:
        q = _hits.setdefault(ip, deque())
        while q and now - q[0] > _WINDOW_S:
            q.popleft()
        if len(q) >= _LIMIT:
            return True
        q.append(now)
        return False


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=10, max_length=5000)
    website: str | None = Field(default=None, max_length=200, description="Honeypot; must stay empty")


@router.post("/contact", status_code=status.HTTP_201_CREATED)
def send_message(req: ContactIn, request: Request, db: DbSession):
    if req.website:  # bots fill hidden fields
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Message rejected.")
    ip = request.client.host if request.client else "unknown"
    if _throttled(ip):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many messages. Please try again later.")
    msg = ContactMessage(
        name=req.name.strip(), email=req.email, subject=req.subject.strip(), message=req.message.strip()
    )
    db.add(msg)
    db.commit()
    return {"id": msg.id, "detail": "Message received. We usually reply within one working day."}


@router.get("/contact")
def list_messages(_: AdminUser, db: DbSession, limit: int = 50):
    rows = db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(min(limit, 200))).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "subject": m.subject,
            "message": m.message,
            "status": m.status,
            "created_at": m.created_at,
        }
        for m in rows
    ]
