import { API_URL, api } from "./apiClient";

export async function fetchAssistantStatus() {
  const { data } = await api.get("/assistant/status");
  return data;
}

export async function searchKnowledge(query, k = 4) {
  const { data } = await api.post("/assistant/search", { query, k });
  return data;
}

/**
 * Split a Server-Sent Events buffer into complete `data:` payloads.
 * Returns parsed events plus the unfinished remainder to keep buffering.
 */
export function parseSse(buffer) {
  const frames = buffer.replace(/\r\n/g, "\n").split("\n\n");
  const rest = frames.pop() ?? "";
  const events = [];
  for (const frame of frames) {
    const data = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      // skip malformed frames
    }
  }
  return { events, rest };
}

/** POST a message and stream the agent's events (EventSource can't POST, so use fetch). */
export async function streamChat({ message, threadId }, onEvent, signal) {
  const res = await fetch(`${API_URL}/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ message, thread_id: threadId }),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail?.[0]?.msg ?? detail?.detail ?? `Assistant error (${res.status})`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parsed = parseSse(buffer + value);
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
}
