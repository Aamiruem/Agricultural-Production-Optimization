import json
from types import SimpleNamespace

from app.ai import agent
from app.ai.rag import get_knowledge_base, load_chunks


# --------------------------------------------------------------- fake Claude
class Block(SimpleNamespace):
    def to_dict(self):
        return {k: v for k, v in vars(self).items()}


class FakeStream:
    def __init__(self, message):
        self._message = message

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def __iter__(self):
        for b in self._message.content:
            if b.type == "text":
                yield SimpleNamespace(type="text", text=b.text)

    def get_final_message(self):
        return self._message


class FakeClient:
    """Replays scripted assistant turns and records every request."""

    def __init__(self, turns):
        self.turns, self.requests = list(turns), []
        self.beta = SimpleNamespace(messages=SimpleNamespace(stream=self._stream))

    def _stream(self, **kwargs):
        self.requests.append(json.loads(json.dumps(kwargs["messages"], default=str)))
        assert kwargs["model"] == "claude-opus-5-5" and kwargs["fallbacks"] == "default"
        assert all(t["eager_input_streaming"] for t in kwargs["tools"])
        return FakeStream(self.turns.pop(0))


def turn(*blocks, stop="end_turn"):
    return SimpleNamespace(content=list(blocks), stop_reason=stop)


def tool_use(id_, name, input_):
    return Block(type="tool_use", id=id_, name=name, input=input_)


def text(t):
    return Block(type="text", text=t)


RICE = {"N": 85, "P": 45, "K": 40, "temperature": 23.5, "humidity": 82, "ph": 6.5, "rainfall": 230}


# --------------------------------------------------------------------- RAG
def test_chunks_are_sections_with_titles():
    chunks = load_chunks()
    assert len(chunks) >= 15
    assert any(c.title == "Common fertilizers in India › Nutrient content of common fertilizers" for c in chunks)


def test_hybrid_search_finds_relevant_sections():
    kb = get_knowledge_base()
    assert kb.search("How much nitrogen does urea and DAP contain?")[0].chunk.source == "fertilizers-india"
    assert kb.search("my soil is too acidic, should I add lime")[0].chunk.source == "soil-ph"
    assert kb.search("when are rabi crops sown")[0].chunk.source == "cropping-seasons"


def test_search_and_status_endpoints(client):
    hits = client.post("/api/assistant/search", json={"query": "split nitrogen doses", "k": 2}).json()
    assert len(hits) <= 2 and hits[0]["source"] == "fertilizers-india"
    status = client.get("/api/assistant/status").json()
    assert status["llm_available"] is False and status["vector_store"] == "in-memory"


def test_chat_without_llm_streams_retrieval_answer(client):
    with client.stream("POST", "/api/assistant/chat", json={"message": "how do I correct sodic soil?"}) as res:
        assert res.headers["content-type"].startswith("text/event-stream")
        events = [json.loads(line[6:]) for line in res.iter_lines() if line.startswith("data: ")]
    assert events[0]["type"] == "token" and "gypsum" in events[0]["text"].lower()
    assert any(e["type"] == "sources" for e in events)
    assert events[-1] == {"type": "done"}


def test_chat_validates_input(client):
    assert client.post("/api/assistant/chat", json={"message": ""}).status_code == 422
    assert client.post("/api/assistant/chat", json={"message": "x" * 2001}).status_code == 422
    assert client.post("/api/assistant/chat", json={"message": "hi", "thread_id": "../etc"}).status_code == 422


# ------------------------------------------------------------------- agent
def run(runner, message, thread="t1"):
    return list(agent.stream_chat(message, thread, runner=runner))


def test_agent_tool_loop_streams_and_keeps_valid_history():
    fake = FakeClient([
        turn(text("Let me check. "), tool_use("tu_1", "recommend_crop", RICE), stop="tool_use"),
        turn(text("Rice is the best match.")),
    ])
    runner = agent.SimpleRunner(fake, "claude-opus-5-5", get_knowledge_base())
    events = run(runner, "N 85 P 45 K 40, 23.5C, 82% humidity, pH 6.5, 230mm rain. What should I grow?")

    kinds = [e["type"] for e in events]
    assert kinds == ["token", "tool", "tool_result", "token", "done"]
    assert events[2] == {"type": "tool_result", "name": "recommend_crop", "is_error": False}

    # Second request: assistant tool_use turn followed by ONE user message with the tool_result.
    second = fake.requests[1]
    assert [m["role"] for m in second] == ["user", "assistant", "user"]
    result = second[2]["content"][0]
    assert result["tool_use_id"] == "tu_1" and json.loads(result["content"])["top"][0]["crop"] == "rice"


def test_agent_memory_carries_across_turns():
    fake = FakeClient([turn(text("Hello Ravi.")), turn(text("Your name is Ravi."))])
    runner = agent.SimpleRunner(fake, "claude-opus-5-5", get_knowledge_base())
    run(runner, "My name is Ravi")
    run(runner, "What is my name?")
    assert [m["role"] for m in fake.requests[1]] == ["user", "assistant", "user"]
    run_other = FakeClient([turn(text("Hi."))])
    other = agent.SimpleRunner(run_other, "claude-opus-5-5", get_knowledge_base())
    run(other, "new thread", thread="t2")
    assert len(run_other.requests[0]) == 1


def test_agent_reports_invalid_tool_input_as_error_and_cites_sources():
    fake = FakeClient([
        turn(tool_use("tu_1", "recommend_crop", {"N": "lots"}),
             tool_use("tu_2", "search_knowledge", {"query": "urea nitrogen content"}), stop="tool_use"),
        turn(text("Urea is 46% N [fertilizers-india].")),
    ])
    runner = agent.SimpleRunner(fake, "claude-opus-5-5", get_knowledge_base())
    events = run(runner, "fertilizer question")

    results = fake.requests[1][2]["content"]
    assert results[0]["is_error"] is True and "INVALID_JSON" in results[0]["content"]
    assert results[1]["is_error"] is False
    sources = next(e for e in events if e["type"] == "sources")["sources"]
    assert sources[0]["source"] == "fertilizers-india"


def test_agent_step_limit_closes_pending_tool_calls():
    loop_turn = turn(tool_use("tu_x", "get_crop_profile", {"crop": "rice"}), stop="tool_use")
    fake = FakeClient([loop_turn] * agent.MAX_ITERATIONS + [turn(text("ok"))])
    runner = agent.SimpleRunner(fake, "claude-opus-5-5", get_knowledge_base())
    events = run(runner, "loop forever")
    assert len(fake.requests) == agent.MAX_ITERATIONS
    assert any(e["type"] == "notice" for e in events)

    run(runner, "next question")  # history must still be valid: last pending tool_use was answered
    last_history = fake.requests[-1]
    assert last_history[-2]["content"][0]["is_error"] is True
    assert last_history[-1] == {"role": "user", "content": "next question"}


def test_agent_errors_become_friendly_events():
    class AuthenticationError(Exception):
        pass

    class Broken:
        beta = SimpleNamespace(messages=SimpleNamespace(stream=lambda **_: (_ for _ in ()).throw(AuthenticationError())))

    runner = agent.SimpleRunner(Broken(), "claude-opus-5-5", get_knowledge_base())
    events = run(runner, "hi")
    assert events[0]["type"] == "error" and "API key" in events[0]["message"]
    assert events[-1] == {"type": "done"}
