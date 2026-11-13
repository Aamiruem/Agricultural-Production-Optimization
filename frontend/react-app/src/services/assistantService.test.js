import { describe, expect, it } from "vitest";

import { applyEvent } from "@/hooks/useChat";

import { parseSse } from "./assistantService";

describe("parseSse", () => {
  it("returns complete frames and keeps the partial remainder", () => {
    const { events, rest } = parseSse('data: {"type":"token","text":"Hi"}\n\ndata: {"type":"do');
    expect(events).toEqual([{ type: "token", text: "Hi" }]);
    expect(parseSse(rest + 'ne"}\n\n').events).toEqual([{ type: "done" }]);
  });

  it("handles CRLF and skips malformed frames", () => {
    expect(parseSse('data: nope\r\n\r\ndata: {"type":"done"}\r\n\r\n').events).toEqual([{ type: "done" }]);
  });
});

describe("applyEvent", () => {
  it("builds an assistant turn from streamed agent events", () => {
    let turn = { id: "a", role: "assistant", text: "", tools: [], sources: [], notices: [] };
    turn = applyEvent(turn, { type: "tool", name: "search_knowledge" });
    turn = applyEvent(turn, { type: "tool_result", name: "search_knowledge", is_error: false });
    turn = applyEvent(turn, { type: "token", text: "Urea is 46% N." });
    turn = applyEvent(turn, { type: "sources", sources: [{ source: "fertilizers-india", title: "Fertilizers" }] });
    expect(turn.text).toBe("Urea is 46% N.");
    expect(turn.tools).toEqual([{ name: "search_knowledge", done: true, isError: false }]);
    expect(turn.sources[0].source).toBe("fertilizers-india");
    expect(applyEvent(turn, { type: "error", message: "busy" }).error).toBe("busy");
  });
});
