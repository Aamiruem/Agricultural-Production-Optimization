import { describe, expect, it } from "vitest";

import { applyEvent } from "@/components/assistant/assistant-chat";

import { parseSse } from "./sse";

describe("parseSse", () => {
  it("parses complete frames and keeps the partial remainder", () => {
    const buf = 'data: {"type":"token","text":"Hel"}\n\ndata: {"type":"token","text":"lo"}\n\ndata: {"type":"do';
    const { events, rest } = parseSse(buf);
    expect(events).toEqual([
      { type: "token", text: "Hel" },
      { type: "token", text: "lo" },
    ]);
    expect(rest).toBe('data: {"type":"do');
    expect(parseSse(rest + 'ne"}\n\n').events).toEqual([{ type: "done" }]);
  });

  it("handles CRLF line endings and skips malformed frames", () => {
    const { events } = parseSse('data: not-json\r\n\r\ndata: {"type":"done"}\r\n\r\n');
    expect(events).toEqual([{ type: "done" }]);
  });
});

describe("applyEvent", () => {
  const empty = { id: "a", role: "assistant" as const, text: "", tools: [], sources: [], notices: [] };

  it("builds an assistant turn from streamed events", () => {
    let turn = applyEvent(empty, { type: "token", text: "Checking. " });
    turn = applyEvent(turn, { type: "tool", name: "search_knowledge", input: { query: "urea" } });
    expect(turn.tools).toEqual([{ name: "search_knowledge", done: false }]);
    turn = applyEvent(turn, { type: "tool_result", name: "search_knowledge", is_error: false });
    turn = applyEvent(turn, { type: "sources", sources: [{ source: "fertilizers-india", title: "Fertilizers" }] });
    turn = applyEvent(turn, { type: "token", text: "Urea is 46% N." });
    expect(turn.text).toBe("Checking. Urea is 46% N.");
    expect(turn.tools).toEqual([{ name: "search_knowledge", done: true, isError: false }]);
    expect(turn.sources[0].source).toBe("fertilizers-india");
    expect(applyEvent(turn, { type: "error", message: "busy" }).error).toBe("busy");
  });
});
