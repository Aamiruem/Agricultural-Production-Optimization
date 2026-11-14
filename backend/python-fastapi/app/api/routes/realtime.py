"""WebSocket: live crop recommendations as the user moves the sliders."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError

from app.api.deps import user_from_token
from app.db.session import SessionLocal
from app.schemas import SoilConditions
from app.services.recommender import recommend_crops

router = APIRouter(tags=["realtime"])
MAX_MESSAGE_BYTES = 4096


@router.websocket("/ws/recommend")
async def live_recommend(ws: WebSocket, token: str | None = None):
    """Signed-in users only: browsers cannot set headers on WebSockets, so the JWT comes as ?token=."""
    db = SessionLocal()
    try:
        user = user_from_token(db, token)
    finally:
        db.close()
    if user is None:
        await ws.close(code=1008, reason="Not authenticated")  # policy violation
        return
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            if len(raw) > MAX_MESSAGE_BYTES:
                await ws.send_json({"type": "error", "message": "message too large"})
                continue
            try:
                soil = SoilConditions.model_validate_json(raw)
            except ValidationError as exc:
                await ws.send_json({"type": "error", "message": exc.errors(include_url=False)[0]["msg"]})
                continue
            rec = await run_in_threadpool(recommend_crops, soil)  # model inference off the event loop
            await ws.send_json({"type": "recommendation", **rec.model_dump()})
    except WebSocketDisconnect:
        pass
