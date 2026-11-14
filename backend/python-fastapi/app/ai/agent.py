"""Tool-using farm assistant: Claude + LangGraph.

Graph:  START → agent ──(tool_use)──► tools ──► agent … ──(done)──► END

* agent node: streams a Claude turn (tokens are forwarded to the client).
* tools node: validates and runs the tools Claude asked for (crop model,
  fertilizer calculator, crop profiles, knowledge-base search).
* A checkpointer keeps each thread's messages (short-term memory).

The node functions are plain Python so they can be unit-tested with a fake
client; `SimpleRunner` executes the same nodes when LangGraph isn't installed.
"""

import json
import logging
import operator
import threading
from collections.abc import Callable, Iterator
from typing import Annotated, Any, Literal, TypedDict

from pydantic import BaseModel, Field, ValidationError

from app.ai.llm import describe_error, get_llm
from app.ai.rag import KnowledgeBase, get_knowledge_base
from app.core.config import get_settings
from app.data.crops import CROPS
from app.schemas import FertilizerRequest, SoilConditions
from app.services.fertilizer import recommend_fertilizer
from app.services.recommender import recommend_crops

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 6  # guardrail: model turns per user message
MAX_THREAD_MESSAGES = 80  # guardrail: conversation length (history is never edited)
JSON_RETRIES = 2

Emit = Callable[[dict], None]

SYSTEM_PROMPT = """You are the AgriOptima farm assistant. You help farmers and agronomy students in India with crop choice, soil nutrients, fertilizers, cropping seasons and irrigation.

Ground your answers in the tools. Use search_knowledge for agronomy guidance and cite the sources you used inline, like [fertilizers-india]. Use recommend_crop, fertilizer_plan and get_crop_profile for numbers instead of estimating them yourself. If a calculation needs readings the user hasn't given, ask for them rather than guessing.

Keep answers practical and brief: a short paragraph or a few bullets, with quantities in kg/ha. Treat recommendations as planning estimates and, when a decision matters, suggest confirming with a soil test or the local Krishi Vigyan Kendra.

You only help with agriculture. If asked about something unrelated, say briefly that you can only help with farming topics."""

_CROP_ENUM = sorted(CROPS)
_SOIL_PROPS = {
    "N": {"type": "number", "description": "Soil nitrogen ratio (0-200)"},
    "P": {"type": "number", "description": "Soil phosphorus ratio (0-200)"},
    "K": {"type": "number", "description": "Soil potassium ratio (0-250)"},
    "temperature": {"type": "number", "description": "Average temperature in °C"},
    "humidity": {"type": "number", "description": "Relative humidity in %"},
    "ph": {"type": "number", "description": "Soil pH (0-14)"},
    "rainfall": {"type": "number", "description": "Rainfall in mm"},
}

TOOLS: list[dict] = [
    {
        "name": "recommend_crop",
        "description": "Rank the best crops for a field from its soil N, P, K, pH and climate "
        "(temperature, humidity, rainfall) using the trained ML model. Needs all seven values.",
        "input_schema": {"type": "object", "properties": _SOIL_PROPS, "required": list(_SOIL_PROPS)},
    },
    {
        "name": "fertilizer_plan",
        "description": "Calculate nutrient gaps and DAP, Urea and MOP doses (kg/ha and total) for a crop, "
        "given the soil N, P, K and the field area in hectares.",
        "input_schema": {
            "type": "object",
            "properties": {
                "crop": {"type": "string", "enum": _CROP_ENUM},
                "N": _SOIL_PROPS["N"],
                "P": _SOIL_PROPS["P"],
                "K": _SOIL_PROPS["K"],
                "area_ha": {"type": "number", "description": "Field area in hectares", "default": 1},
            },
            "required": ["crop", "N", "P", "K"],
        },
    },
    {
        "name": "get_crop_profile",
        "description": "Get the typical growing conditions (N, P, K, pH, temperature, humidity, rainfall, season) of a crop.",
        "input_schema": {
            "type": "object",
            "properties": {"crop": {"type": "string", "enum": _CROP_ENUM}},
            "required": ["crop"],
        },
    },
    {
        "name": "search_knowledge",
        "description": "Search the agronomy knowledge base (soil testing, fertilizers, soil pH, seasons, "
        "crop guides, irrigation). Returns passages with a source id to cite.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "What to look up"}},
            "required": ["query"],
        },
    },
]
# Streamed requests with client tools: stream tool inputs as they're generated.
# The API then doesn't validate inputs, so every input is checked with Pydantic below.
for _tool in TOOLS:
    _tool["eager_input_streaming"] = True


class _CropInput(BaseModel):
    crop: Literal[tuple(_CROP_ENUM)]  # type: ignore[valid-type]


class _SearchInput(BaseModel):
    query: str = Field(min_length=2, max_length=300)


class AgentState(TypedDict, total=False):
    messages: Annotated[list[dict], operator.add]
    iterations: int
    stop_reason: str | None
    sources: list[dict]


# ----------------------------------------------------------------- tools
def execute_tool(name: str, raw: Any, kb: KnowledgeBase) -> tuple[str, bool, list[dict]]:
    """Run one tool. Returns (result_json, is_error, sources)."""
    try:
        if name == "recommend_crop":
            result = recommend_crops(SoilConditions.model_validate(raw)).model_dump()
        elif name == "fertilizer_plan":
            result = recommend_fertilizer(FertilizerRequest.model_validate(raw)).model_dump()
        elif name == "get_crop_profile":
            result = CROPS[_CropInput.model_validate(raw).crop].to_dict()
        elif name == "search_knowledge":
            hits = kb.search(_SearchInput.model_validate(raw).query, k=3)
            passages = [{"source": h.chunk.source, "title": h.chunk.title, "text": h.chunk.text} for h in hits]
            sources = [{"source": h.chunk.source, "title": h.chunk.title} for h in hits]
            return (
                json.dumps({"passages": passages} if passages else {"passages": [], "note": "no match"}),
                False,
                sources,
            )
        else:
            return json.dumps({"error": f"unknown tool {name}"}), True, []
    except ValidationError as exc:
        # Same handling as unparseable JSON: report it so Claude can retry with valid input.
        return (
            json.dumps(
                {"INVALID_JSON": json.dumps(raw, default=str), "errors": exc.errors(include_url=False)}, default=str
            ),
            True,
            [],
        )
    except KeyError as exc:
        return json.dumps({"error": f"unknown value {exc}"}), True, []
    return json.dumps(result), False, []


# ----------------------------------------------------------------- nodes
def _block_to_dict(block: Any) -> dict:
    """Pass blocks back unchanged (thinking blocks included) on the next request."""
    if isinstance(block, dict):
        return block
    return block.to_dict() if hasattr(block, "to_dict") else block.model_dump(exclude_none=True)


def _last_tool_uses(state: AgentState) -> list[dict]:
    last = state["messages"][-1]
    if last["role"] != "assistant" or not isinstance(last["content"], list):
        return []
    return [b for b in last["content"] if b.get("type") == "tool_use"]


def call_model(state: AgentState, *, client: Any, model: str, emit: Emit) -> dict:
    """agent node: one streamed Claude turn."""
    final = None
    for attempt in range(JSON_RETRIES + 1):
        try:
            with client.beta.messages.stream(
                model=model,
                max_tokens=16000,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=state["messages"],
                output_config={"effort": "medium"},
                # Server-side fallback: if a safety classifier declines, the API
                # retries on a suitable model within the same call.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            ) as stream:
                for event in stream:
                    if event.type == "text":
                        emit({"type": "token", "text": event.text})
                final = stream.get_final_message()
            break
        except ValueError:  # tool-input JSON the SDK couldn't parse: re-issue the turn
            if attempt == JSON_RETRIES:
                raise
            emit({"type": "notice", "text": "Retrying…"})

    if final.stop_reason == "refusal":
        emit({"type": "notice", "text": "The assistant declined to answer this request."})
    elif final.stop_reason == "max_tokens" and any(b.type == "tool_use" for b in final.content):
        emit({"type": "notice", "text": "The answer was cut off. Please ask a narrower question."})

    return {
        "messages": [{"role": "assistant", "content": [_block_to_dict(b) for b in final.content]}],
        "iterations": state.get("iterations", 0) + 1,
        "stop_reason": final.stop_reason,
    }


def route(state: AgentState) -> str:
    """Conditional edge after the agent node.

    tools — a complete tool_use turn within the iteration budget
    close — tool calls we won't run (budget spent, truncated or refused turn);
            they still need tool_results or the next request is rejected
    end   — a final answer
    """
    if not _last_tool_uses(state):
        return "end"
    if state.get("stop_reason") == "tool_use" and state.get("iterations", 0) < MAX_ITERATIONS:
        return "tools"
    return "close"


def close_pending_tools(state: AgentState, *, emit: Emit) -> dict:
    """close node: answer unrun tool calls with errors so the history stays valid."""
    if state.get("iterations", 0) >= MAX_ITERATIONS:
        emit({"type": "notice", "text": "Stopped after several steps. Try a more specific question."})
    results = [
        {
            "type": "tool_result",
            "tool_use_id": b["id"],
            "is_error": True,
            "content": "Not run: the step limit for this question was reached or the request was cut off.",
        }
        for b in _last_tool_uses(state)
    ]
    return {"messages": [{"role": "user", "content": results}]}


def run_tools(state: AgentState, *, kb: KnowledgeBase, emit: Emit) -> dict:
    """tools node: execute every tool_use and return all results in ONE user message."""
    results, sources = [], list(state.get("sources", []))
    for block in _last_tool_uses(state):
        emit({"type": "tool", "name": block["name"], "input": block.get("input")})
        content, is_error, new_sources = execute_tool(block["name"], block.get("input"), kb)
        for s in new_sources:
            if s not in sources:
                sources.append(s)
        emit({"type": "tool_result", "name": block["name"], "is_error": is_error})
        results.append({"type": "tool_result", "tool_use_id": block["id"], "content": content, "is_error": is_error})
    if sources:
        emit({"type": "sources", "sources": sources})
    return {"messages": [{"role": "user", "content": results}], "sources": sources}


# --------------------------------------------------------------- runners
def build_langgraph(client: Any, model: str, kb: KnowledgeBase):
    from langgraph.checkpoint.memory import InMemorySaver
    from langgraph.config import get_stream_writer
    from langgraph.graph import END, START, StateGraph

    graph = StateGraph(AgentState)
    graph.add_node("agent", lambda s: call_model(s, client=client, model=model, emit=get_stream_writer()))
    graph.add_node("tools", lambda s: run_tools(s, kb=kb, emit=get_stream_writer()))
    graph.add_node("close", lambda s: close_pending_tools(s, emit=get_stream_writer()))
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", route, {"tools": "tools", "close": "close", "end": END})
    graph.add_edge("tools", "agent")
    graph.add_edge("close", END)
    return graph.compile(checkpointer=InMemorySaver())


class LangGraphRunner:
    name = "langgraph"

    def __init__(self, client: Any, model: str, kb: KnowledgeBase):
        self._graph = build_langgraph(client, model, kb)

    def history_length(self, thread_id: str) -> int:
        snapshot = self._graph.get_state({"configurable": {"thread_id": thread_id}})
        return len(snapshot.values.get("messages", [])) if snapshot and snapshot.values else 0

    def stream(self, thread_id: str, user_message: dict) -> Iterator[dict]:
        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 2 * MAX_ITERATIONS + 4}
        state_in = {"messages": [user_message], "iterations": 0, "stop_reason": None, "sources": []}
        yield from self._graph.stream(state_in, config, stream_mode="custom")


class SimpleRunner:
    """Executes the same nodes without LangGraph (used where it isn't installed)."""

    name = "simple"

    def __init__(self, client: Any, model: str, kb: KnowledgeBase):
        self._client, self._model, self._kb = client, model, kb
        self._threads: dict[str, list[dict]] = {}
        self._lock = threading.Lock()

    def history_length(self, thread_id: str) -> int:
        return len(self._threads.get(thread_id, []))

    def stream(self, thread_id: str, user_message: dict) -> Iterator[dict]:
        with self._lock:
            history = list(self._threads.get(thread_id, []))
        state: AgentState = {"messages": history + [user_message], "iterations": 0, "stop_reason": None, "sources": []}
        events: list[dict] = []
        while True:
            update = call_model(state, client=self._client, model=self._model, emit=events.append)
            state = {**state, **update, "messages": state["messages"] + update["messages"]}
            yield from events
            events.clear()
            next_step = route(state)
            if next_step == "end":
                break
            if next_step == "close":
                update = close_pending_tools(state, emit=events.append)
                state = {**state, "messages": state["messages"] + update["messages"]}
                yield from events
                break
            update = run_tools(state, kb=self._kb, emit=events.append)
            state = {**state, **update, "messages": state["messages"] + update["messages"]}
            yield from events
            events.clear()
        with self._lock:
            self._threads[thread_id] = state["messages"]


_runner = None
_runner_lock = threading.Lock()


def get_runner():
    """Build the agent runner once (None when no LLM is available)."""
    global _runner
    with _runner_lock:
        if _runner is None:
            llm = get_llm()
            if not llm.available:
                return None
            model, kb = get_settings().anthropic_model, get_knowledge_base()
            try:
                _runner = LangGraphRunner(llm.client, model, kb)
            except Exception as exc:  # LangGraph missing or blocked
                logger.warning("LangGraph unavailable (%s); using SimpleRunner", exc)
                _runner = SimpleRunner(llm.client, model, kb)
        return _runner


def runtime_name() -> str:
    try:
        import langgraph.graph  # noqa: F401

        return "langgraph"
    except Exception:
        return "simple"


# ----------------------------------------------------------- public API
def retrieval_only_answer(message: str, reason: str) -> Iterator[dict]:
    """Fallback when no LLM is configured: show the most relevant passages."""
    hits = get_knowledge_base().search(message, k=3)
    if not hits:
        yield {"type": "token", "text": "I couldn't find anything about that in the knowledge base."}
    else:
        parts = [f"The AI model isn't available ({reason}), so here is the most relevant guidance:\n"]
        parts += [f"\n**{h.chunk.title}**\n\n{h.chunk.text}\n" for h in hits]
        yield {"type": "token", "text": "".join(parts)}
        yield {"type": "sources", "sources": [{"source": h.chunk.source, "title": h.chunk.title} for h in hits]}


def stream_chat(message: str, thread_id: str, runner=None) -> Iterator[dict]:
    """Yield SSE-ready events: token | tool | tool_result | sources | notice | error | done."""
    runner = runner or get_runner()
    try:
        if runner is None:
            yield from retrieval_only_answer(message, get_llm().reason)
        elif runner.history_length(thread_id) >= MAX_THREAD_MESSAGES:
            yield {"type": "error", "message": "This conversation is long. Start a new chat to continue."}
        else:
            yield from runner.stream(thread_id, {"role": "user", "content": message})
    except Exception as exc:
        logger.exception("assistant error")
        yield {"type": "error", "message": describe_error(exc)}
    yield {"type": "done"}
