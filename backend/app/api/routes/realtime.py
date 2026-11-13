"""WebSocket: live crop recommendations as the user moves the sliders."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError

from app.schemas import SoilConditions
from app.services.recommender import recommend_crops

router = APIRouter(tags=["realtime"])
MAX_MESSAGE_BYTES = 4096


@router.websocket("/ws/recommend")
async def live_recommend(ws: WebSocket):
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
