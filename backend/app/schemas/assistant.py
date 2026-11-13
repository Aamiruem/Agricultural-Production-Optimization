from pydantic import BaseModel, Field

MAX_MESSAGE_CHARS = 2000


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    # Client-generated conversation id; the agent keeps short-term memory per thread.
    thread_id: str = Field(default="default", min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    k: int = Field(default=4, ge=1, le=10)


class SearchHit(BaseModel):
    id: str
    source: str
    title: str
    text: str
    score: float


class AssistantStatus(BaseModel):
    llm_available: bool
    llm_reason: str
    model: str
    agent_runtime: str
    vector_store: str
    embedder: str
    documents: int
