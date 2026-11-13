import { useSyncExternalStore } from "react";

import { localFarms } from "@/lib/localFarms";
import { getValidToken } from "@/store/authStore";

import { farmApi, isApiUnavailable } from "./apiClient";

// Node farm-service (Express + MongoDB). Signed-out users, and signed-in users whose
// farm-service or database is unreachable, use the on-device store instead.

let mode = "device"; // "cloud" | "device"
let reason = "signed-out"; // why we're on the device store
const listeners = new Set();
function setMode(next, why) {
  if (next === mode && why === reason) return;
  mode = next;
  reason = why;
  listeners.forEach((l) => l());
}

/** `{ mode: "cloud" | "device", reason }` — reactive. */
export function useFarmStorage() {
  const snapshot = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => `${mode}|${reason}`);
  const [m, r] = snapshot.split("|");
  return { mode: m, reason: r };
}

async function call(remote, local) {
  if (!getValidToken()) {
    setMode("device", "signed-out");
    return local();
  }
  try {
    const data = await remote();
    if (typeof data === "string") throw Object.assign(new Error("API returned HTML"), { code: "API_HTML" });
    setMode("cloud", "ok");
    return data;
  } catch (error) {
    if (error?.code !== "API_HTML" && !isApiUnavailable(error)) throw error;
    setMode("device", error?.response?.status === 503 ? "database-down" : "service-down");
    return local();
  }
}

export const fetchFarms = () => call(async () => (await farmApi.get("/farms")).data, () => localFarms.listFarms());

export function createFarm({ name, district, state, village, lat, lng }) {
  const location = {
    district: district || undefined, state: state || undefined, village: village || undefined,
    ...(typeof lat === "number" && typeof lng === "number" ? { lat, lng } : {}),
  };
  return call(async () => (await farmApi.post("/farms", { name, location })).data, () => localFarms.createFarm({ name, location }));
}

export const deleteFarm = (id) => call(async () => { await farmApi.delete(`/farms/${id}`); }, () => localFarms.deleteFarm(id));

export const fetchFarmSummary = (id) => call(async () => (await farmApi.get(`/farms/${id}/summary`)).data, () => localFarms.summary(id));

export const fetchFields = (farmId) => call(async () => (await farmApi.get(`/farms/${farmId}/fields`)).data, () => localFarms.listFields(farmId));

export const createField = (farmId, field) => call(async () => (await farmApi.post(`/farms/${farmId}/fields`, field)).data, () => localFarms.createField(farmId, field));

export const deleteField = (id) => call(async () => { await farmApi.delete(`/fields/${id}`); }, () => localFarms.deleteField(id));

export const logActivity = (fieldId, activity) => call(async () => (await farmApi.post(`/fields/${fieldId}/activities`, activity)).data, () => localFarms.logActivity(fieldId, activity));

/** The Node service asks the Python ML service for the plan (microservice call). */
export const fieldFertilizerPlan = (fieldId) => call(async () => (await farmApi.post(`/fields/${fieldId}/fertilizer-plan`)).data, () => localFarms.fertilizerPlan(fieldId));

/** Presigned URL from the service → PUT straight to S3 → record the key (device: thumbnail). */
export function uploadFieldPhoto(fieldId, file) {
  return call(async () => {
    const { data: presign } = await farmApi.post(`/fields/${fieldId}/photos/presign`, { contentType: file.type, size: file.size });
    const put = await fetch(presign.uploadUrl, { method: "PUT", headers: presign.headers, body: file });
    if (!put.ok) throw new Error(`Upload to storage failed (${put.status})`);
    const { data } = await farmApi.post(`/fields/${fieldId}/photos`, { key: presign.key });
    return data;
  }, () => localFarms.addPhoto(fieldId, file));
}
