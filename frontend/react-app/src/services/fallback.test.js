import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";

import { isApiUnavailable, withFallback } from "./apiClient";

const httpError = (status) => new AxiosError("fail", "ERR", { baseURL: "/api" }, null, status ? { status, data: {} } : undefined);

describe("API fallback", () => {
  it("treats network errors, 404/405 and gateway errors as 'API unavailable'", () => {
    expect(isApiUnavailable(httpError())).toBe(true);
    for (const s of [404, 405, 502, 503, 504]) expect(isApiUnavailable(httpError(s)), String(s)).toBe(true);
    expect(isApiUnavailable(httpError(422))).toBe(false);
    expect(isApiUnavailable(httpError(401))).toBe(false);
  });

  it("returns server data when the API answers", async () => {
    const local = vi.fn();
    await expect(withFallback(async () => ({ ok: 1 }), local)).resolves.toEqual({ ok: 1 });
    expect(local).not.toHaveBeenCalled();
  });

  it("runs the browser model and labels it when the API is missing", async () => {
    await expect(withFallback(() => Promise.reject(httpError(405)), () => ({ y: 2 }))).resolves.toEqual({ engine: "browser", y: 2 });
    // A static host answering /api with the SPA shell (HTML string) also falls back.
    await expect(withFallback(async () => "<!doctype html>", () => ({ y: 3 }))).resolves.toEqual({ engine: "browser", y: 3 });
  });

  it("keeps validation errors from the API instead of hiding them", async () => {
    const err = httpError(422);
    await expect(withFallback(() => Promise.reject(err), () => ({}))).rejects.toBe(err);
  });
});
