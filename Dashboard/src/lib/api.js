// Resilient HTTP client for the three AgriSmart services.
//
//   api  -> FastAPI   (/api/...)       ML, auth, analytics, assistant, system status
//   farm -> Express   (/farm-api/...)  farms, fields, activities
//   mcp  -> MCP server (/mcp)          JSON-RPC tool calls over stateless streamable HTTP
//
// Under load the platform answers 503 + Retry-After (FastAPI load shedding or the
// gateway) or 429 (gateway rate limit). This client:
//   * retries idempotent requests on network errors and 502/503/504, and any request
//     on 429/503-with-Retry-After (rejected before any work was done), with
//     exponential backoff + jitter, honouring Retry-After;
//   * aborts slow requests (timeout) so the UI never hangs;
//   * opens a per-service circuit breaker after repeated failures, failing fast for
//     a cool-down instead of piling more load on a struggling service.

const BASE = (import.meta.env?.VITE_API_BASE ?? "").replace(/\/$/, "");
const TOKEN_KEY = "agrismart.console.token";

export class ApiError extends Error {
  constructor(status, message, { retryAfter = null, body = null, service = "api" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.body = body;
    this.service = service;
  }
}

// ------------------------------------------------------------------ auth token
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the session lasts until reload */
  }
  window.dispatchEvent(new CustomEvent("auth:changed"));
}

// ------------------------------------------------------------- circuit breaker
const BREAKER = { threshold: 5, coolDownMs: 15_000 };
const breakers = { api: newBreaker(), farm: newBreaker(), mcp: newBreaker() };

function newBreaker() {
  return { failures: 0, openUntil: 0 };
}

export function breakerState(service) {
  const b = breakers[service];
  if (!b) return "closed";
  if (b.openUntil > Date.now()) return "open";
  return b.failures >= BREAKER.threshold ? "half-open" : "closed";
}

function emitBreaker() {
  window.dispatchEvent(new CustomEvent("api:breaker"));
}

function recordSuccess(service) {
  const b = breakers[service];
  if (b.failures || b.openUntil) {
    b.failures = 0;
    b.openUntil = 0;
    emitBreaker();
  }
}

function recordFailure(service) {
  const b = breakers[service];
  b.failures += 1;
  if (b.failures >= BREAKER.threshold) {
    b.openUntil = Date.now() + BREAKER.coolDownMs;
    emitBreaker();
  }
}

export function resetBreakers() {
  for (const key of Object.keys(breakers)) breakers[key] = newBreaker();
  emitBreaker();
}

// --------------------------------------------------------------------- helpers
const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });

export function backoffDelay(attempt, retryAfterS) {
  if (retryAfterS != null && Number.isFinite(retryAfterS)) return Math.min(retryAfterS * 1000, 5000);
  const base = 300 * 2 ** attempt;
  return Math.min(base + Math.random() * base * 0.3, 5000);
}

function parseRetryAfter(res) {
  const raw = res.headers.get("retry-after");
  if (!raw) return null;
  const s = Number(raw);
  return Number.isFinite(s) ? s : null;
}

function errorMessage(status, body, service) {
  const detail = body && typeof body === "object" ? body.detail ?? body.message ?? body.error : null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return `${detail[0].loc?.slice(-1)[0] ?? "input"}: ${detail[0].msg}`;
  if (status === 429) return "Too many requests — slowing down.";
  if (status === 503) return "Service is busy or restarting. Retrying shortly.";
  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "Your account doesn't have permission for this.";
  return `${service} request failed (${status})`;
}

async function readBody(res) {
  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) return res.json().catch(() => null);
  const text = await res.text().catch(() => "");
  return text || null;
}

/**
 * Low-level request returning { data, status, headers, ms }.
 * Options: method, body (JSON), form (URLSearchParams), headers, service, timeoutMs,
 * retries, auth (attach bearer token), signal.
 */
export async function requestRaw(path, opts = {}) {
  const {
    method = "GET", body, form, headers = {}, service = "api", timeoutMs = 12_000,
    auth = true, signal, retries = method === "GET" ? 2 : 1,
  } = opts;
  if (breakerState(service) === "open") {
    throw new ApiError(503, `${service === "api" ? "The API" : service} is temporarily unavailable. Retrying automatically.`, { service });
  }

  const idempotent = method === "GET" || method === "HEAD";
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), timeoutMs);
    const onAbort = () => controller.abort(signal.reason);
    signal?.addEventListener("abort", onAbort, { once: true });
    const started = performance.now();
    try {
      const h = { Accept: "application/json", ...headers };
      const token = auth ? getToken() : null;
      if (token) h.Authorization = `Bearer ${token}`;
      let payload;
      if (form) {
        payload = form;
        h["Content-Type"] = "application/x-www-form-urlencoded";
      } else if (body !== undefined) {
        payload = JSON.stringify(body);
        h["Content-Type"] = "application/json";
      }
      const res = await fetch(`${BASE}${path}`, { method, headers: h, body: payload, signal: controller.signal });
      const ms = performance.now() - started;
      const data = await readBody(res);
      if (res.ok) {
        recordSuccess(service);
        return { data, status: res.status, headers: res.headers, ms };
      }
      const retryAfter = parseRetryAfter(res);
      const err = new ApiError(res.status, errorMessage(res.status, data, service), { retryAfter, body: data, service });
      if (res.status === 401 && token) {
        setToken(null);
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }
      const shed = res.status === 429 || (res.status === 503 && retryAfter != null);
      const transient = [502, 503, 504].includes(res.status);
      if (res.status >= 500) recordFailure(service);
      if (attempt < retries && (shed || (idempotent && transient))) {
        lastError = err;
        await sleep(backoffDelay(attempt, retryAfter), signal);
        continue;
      }
      throw err;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (signal?.aborted) throw error;
      const timedOut = controller.signal.reason?.name === "TimeoutError";
      recordFailure(service);
      lastError = new ApiError(0, timedOut ? "The request timed out." : "Can't reach the server. Check that the services are running.", { service });
      if (attempt < retries && idempotent) {
        await sleep(backoffDelay(attempt), signal);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  throw lastError;
}

export async function request(path, opts) {
  return (await requestRaw(path, opts)).data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export const farmApi = {
  get: (path, opts) => request(`/farm-api${path}`, { ...opts, method: "GET", service: "farm" }),
  post: (path, body, opts) => request(`/farm-api${path}`, { ...opts, method: "POST", body, service: "farm" }),
  del: (path, opts) => request(`/farm-api${path}`, { ...opts, method: "DELETE", service: "farm" }),
};

// -------------------------------------------------------------------- SSE
/** Parse a Server-Sent Events chunk stream; calls onEvent(obj) for each `data:` JSON line. */
export function createSseParser(onEvent) {
  let buffer = "";
  return (chunk) => {
    buffer += chunk;
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      try {
        onEvent(JSON.parse(data));
      } catch {
        onEvent({ type: "token", text: data });
      }
    }
  };
}

export async function streamSse(path, body, onEvent, { signal } = {}) {
  const headers = { "Content-Type": "application/json", Accept: "text/event-stream" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    const data = await readBody(res);
    throw new ApiError(res.status, errorMessage(res.status, data, "assistant"), { retryAfter: parseRetryAfter(res), body: data });
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  const feed = createSseParser(onEvent);
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    feed(value);
  }
  feed("\n\n");
}

// -------------------------------------------------------------------- MCP
let rpcId = 0;

/** JSON-RPC call to the stateless MCP server (no session: any replica can answer). */
export async function mcpRpc(method, params = {}, opts = {}) {
  rpcId += 1;
  const data = await request("/mcp", {
    method: "POST",
    service: "mcp",
    auth: false,
    retries: 1,
    timeoutMs: 30_000,
    headers: { Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-06-18" },
    body: { jsonrpc: "2.0", id: rpcId, method, params },
    ...opts,
  });
  if (data?.error) throw new ApiError(400, data.error.message ?? "MCP error", { body: data, service: "mcp" });
  return data?.result;
}

/** Decode a tools/call result into a plain value (structured content or JSON text). */
export function mcpResultValue(result) {
  if (!result) return null;
  if (result.structuredContent !== undefined) {
    const sc = result.structuredContent;
    return sc && typeof sc === "object" && "result" in sc && Object.keys(sc).length === 1 ? sc.result : sc;
  }
  const texts = (result.content ?? []).filter((c) => c.type === "text").map((c) => c.text);
  if (texts.length === 1) {
    try {
      return JSON.parse(texts[0]);
    } catch {
      return texts[0];
    }
  }
  return texts.length ? texts : result.content;
}
