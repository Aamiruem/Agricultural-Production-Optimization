// Service-to-service call to the Python (FastAPI) ML service.
// Retries transient failures (network errors, 502/503/504) with exponential
// backoff and honours Retry-After from the API's load shedding, so a brief
// overload on one replica doesn't fail the user's request.
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const RETRYABLE = new Set([502, 503, 504]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callAgriApi(path, body, { retries = 2, timeoutMs = 5000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let res;
    try {
      res = await fetch(`${env.AGRI_API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(150 * 2 ** attempt);
      continue;
    }
    if (RETRYABLE.has(res.status) && attempt < retries) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(
        Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 2000) : 150 * 2 ** attempt,
      );
      continue;
    }
    return res;
  }
  throw new HttpError(502, `The ML service is unreachable (${lastError?.name ?? "error"})`);
}

export async function fertilizerPlan({ crop, N, P, K, areaHa }) {
  const res = await callAgriApi("/recommend/fertilizer", { crop, N, P, K, area_ha: areaHa });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) throw new HttpError(422, `No fertilizer profile for crop '${crop}'`);
  if (!res.ok) throw new HttpError(502, body.detail ?? `ML service error (${res.status})`);
  return body;
}
