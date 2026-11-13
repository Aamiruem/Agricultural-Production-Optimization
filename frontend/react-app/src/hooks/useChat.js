import { useCallback, useEffect, useRef, useState } from "react";

import { streamChat } from "@/services/assistantService";

/** Apply one streamed agent event to the assistant turn being built (pure, testable). */
export function applyEvent(turn, event) {
  switch (event.type) {
    case "token":
      return { ...turn, text: turn.text + event.text };
    case "tool":
      return { ...turn, tools: [...turn.tools, { name: event.name, done: false }] };
    case "tool_result": {
      const i = turn.tools.findIndex((t) => t.name === event.name && !t.done);
      if (i < 0) return turn;
      const tools = turn.tools.map((t, j) => (j === i ? { ...t, done: true, isError: event.is_error } : t));
      return { ...turn, tools };
    }
    case "sources":
      return { ...turn, sources: event.sources };
    case "notice":
      return { ...turn, notices: [...turn.notices, event.text] };
    case "error":
      return { ...turn, error: event.message };
    default:
      return turn;
  }
}

const newTurn = (role, text = "") => ({ id: crypto.randomUUID(), role, text, tools: [], sources: [], notices: [] });
const newThreadId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);

/** Chat state: messages, streaming status, conversation thread (agent memory). */
export function useChat() {
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const threadRef = useRef(newThreadId());
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (message) => {
      const text = message.trim();
      if (!text || busy) return;
      const assistant = newTurn("assistant");
      setTurns((prev) => [...prev, newTurn("user", text), assistant]);
      setBusy(true);
      const update = (fn) => setTurns((prev) => prev.map((t) => (t.id === assistant.id ? fn(t) : t)));

      abortRef.current = new AbortController();
      try {
        await streamChat({ message: text, threadId: threadRef.current }, (e) => update((t) => applyEvent(t, e)), abortRef.current.signal);
      } catch (err) {
        if (err.name !== "AbortError") {
          const message = err instanceof TypeError ? "Cannot reach the assistant. Is the FastAPI backend running?" : err.message;
          update((t) => ({ ...t, error: message }));
        }
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
    threadRef.current = newThreadId(); // new thread = fresh agent memory
  }, []);

  return { turns, busy, send, reset };
}
