import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, backoffDelay, breakerState, createSseParser, mcpResultValue, requestRaw, resetBreakers } from "./api.js";

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

describe("requestRaw", () => {
  beforeEach(() => {
    resetBreakers();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a shed POST (503 + Retry-After) and then succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(503, { detail: "busy" }, { "retry-after": "1" }))
      .mockResolvedValueOnce(json(200, { top: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const pending = requestRaw("/api/recommend/crop", { method: "POST", body: { N: 1 } });
    await vi.advanceTimersByTimeAsync(1000);
    const res = await pending;
    expect(res.data).toEqual({ top: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a POST that failed for a non-transient reason", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(422, { detail: [{ loc: ["body", "N"], msg: "too large" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestRaw("/api/x", { method: "POST", body: {} })).rejects.toMatchObject({ status: 422, message: "N: too large" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries GETs on network errors with backoff", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(json(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const pending = requestRaw("/api/health");
    await vi.advanceTimersByTimeAsync(1000);
    expect((await pending).data).toEqual({ ok: true });
  });

  it("opens the circuit after repeated failures and then fails fast", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    for (let i = 0; i < 5; i += 1) {
      await expect(requestRaw("/api/x", { retries: 0 })).rejects.toBeInstanceOf(ApiError);
    }
    expect(breakerState("api")).toBe("open");
    const calls = fetchMock.mock.calls.length;
    await expect(requestRaw("/api/x", { retries: 0 })).rejects.toMatchObject({ status: 503 });
    expect(fetchMock.mock.calls.length).toBe(calls); // no request sent while open
    expect(breakerState("farm")).toBe("closed"); // breakers are per service
  });
});

describe("helpers", () => {
  it("honours Retry-After and caps backoff", () => {
    expect(backoffDelay(0, 2)).toBe(2000);
    expect(backoffDelay(0, 60)).toBe(5000);
    expect(backoffDelay(10)).toBeLessThanOrEqual(5000);
  });

  it("parses SSE frames split across chunks", () => {
    const events = [];
    const feed = createSseParser((e) => events.push(e));
    feed('data: {"type":"token","text":"Hel');
    feed('lo"}\n\ndata: {"type":"done"}\n\n');
    expect(events).toEqual([{ type: "token", text: "Hello" }, { type: "done" }]);
  });

  it("decodes MCP tool results", () => {
    expect(mcpResultValue({ content: [{ type: "text", text: '{"a":1}' }] })).toEqual({ a: 1 });
    expect(mcpResultValue({ structuredContent: { result: [1, 2] }, content: [] })).toEqual([1, 2]);
    expect(mcpResultValue({ structuredContent: { crop: "rice", area_ha: 2 } })).toEqual({ crop: "rice", area_ha: 2 });
  });
});

describe("shared crop photos", async () => {
  const { cropPhotoUrl } = await import("./cropPhotos.js");
  it("maps model, dataset and UI names onto the React app's photos", () => {
    expect(cropPhotoUrl("rice")).toBe("/images/crops/rice.webp");
    expect(cropPhotoUrl("mungbean")).toBe("/images/crops/green-gram.webp");
    expect(cropPhotoUrl("Arhar/Tur")).toBe("/images/crops/pigeon-pea.webp");
    expect(cropPhotoUrl("Moong(Green Gram)")).toBe("/images/crops/green-gram.webp");
    expect(cropPhotoUrl("Pearl Millet")).toBe("/images/crops/pearl-millet.webp");
    expect(cropPhotoUrl("grapes")).toBeNull(); // no photo -> icon fallback
  });
  it("every mapped photo exists in the React app", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(__dirname, "..", "..", "..", "frontend", "react-app", "public");
    for (const name of ["rice", "mungbean", "Arhar/Tur", "Bajra", "Jowar", "Ragi", "Soyabean", "Cotton(lint)", "Dry chillies", "Gram"]) {
      const url = cropPhotoUrl(name);
      expect(url, name).not.toBeNull();
      expect(existsSync(join(dir, url)), url).toBe(true);
    }
  });
});
