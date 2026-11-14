import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.ai.agent import runtime_name, stream_chat
from app.ai.llm import get_llm
from app.ai.rag import get_knowledge_base
from app.core.config import get_settings
from app.schemas.assistant import AssistantStatus, ChatRequest, SearchHit, SearchRequest

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/status", response_model=AssistantStatus)
def status():
    llm, kb = get_llm(), get_knowledge_base()
    return AssistantStatus(
        llm_available=llm.available,
        llm_reason=llm.reason,
        model=get_settings().anthropic_model,
        agent_runtime=runtime_name(),
        vector_store=kb.store.name,
        embedder=kb.embedder.name,
        documents=len(kb.chunks),
    )


@router.post("/search", response_model=list[SearchHit])
def search(req: SearchRequest):
    """Semantic + keyword (hybrid) search over the agronomy knowledge base."""
    return [
        SearchHit(id=h.chunk.id, source=h.chunk.source, title=h.chunk.title, text=h.chunk.text, score=round(h.score, 4))
        for h in get_knowledge_base().search(req.query, k=req.k)
    ]


@router.post("/chat")
def chat(req: ChatRequest):
    """Server-Sent Events stream of agent events (token, tool, tool_result, sources, notice, error, done)."""

    def events():
        for event in stream_chat(req.message, req.thread_id):
            yield f"data: {json.dumps(event, default=str)}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},  # no proxy buffering (Nginx)
    )
