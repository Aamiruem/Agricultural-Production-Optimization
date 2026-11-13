// Service-to-service call to the Python (FastAPI) ML service.
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export async function fertilizerPlan({ crop, N, P, K, areaHa }) {
  let res;
  try {
    res = await fetch(`${env.AGRI_API_URL}/recommend/fertilizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop, N, P, K, area_ha: areaHa }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new HttpError(502, "The ML service is unreachable");
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) throw new HttpError(422, `No fertilizer profile for crop '${crop}'`);
  if (!res.ok) throw new HttpError(502, body.detail ?? `ML service error (${res.status})`);
  return body;
}
