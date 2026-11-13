import { farmApi } from "./apiClient";

// Node farm-service (Express + MongoDB)

export async function fetchFarms() {
  const { data } = await farmApi.get("/farms");
  return data;
}

export async function createFarm({ name, district, state }) {
  const { data } = await farmApi.post("/farms", {
    name,
    location: { district: district || undefined, state: state || undefined },
  });
  return data;
}

export async function deleteFarm(id) {
  await farmApi.delete(`/farms/${id}`);
}

export async function fetchFarmSummary(id) {
  const { data } = await farmApi.get(`/farms/${id}/summary`);
  return data;
}

export async function fetchFields(farmId) {
  const { data } = await farmApi.get(`/farms/${farmId}/fields`);
  return data;
}

export async function createField(farmId, field) {
  const { data } = await farmApi.post(`/farms/${farmId}/fields`, field);
  return data;
}

export async function deleteField(id) {
  await farmApi.delete(`/fields/${id}`);
}

export async function logActivity(fieldId, activity) {
  const { data } = await farmApi.post(`/fields/${fieldId}/activities`, activity);
  return data;
}

/** The Node service asks the Python ML service for the plan (microservice call). */
export async function fieldFertilizerPlan(fieldId) {
  const { data } = await farmApi.post(`/fields/${fieldId}/fertilizer-plan`);
  return data;
}

/** Presigned URL from the service → PUT straight to S3 → record the key. */
export async function uploadFieldPhoto(fieldId, file) {
  const { data: presign } = await farmApi.post(`/fields/${fieldId}/photos/presign`, {
    contentType: file.type,
    size: file.size,
  });
  const put = await fetch(presign.uploadUrl, { method: "PUT", headers: presign.headers, body: file });
  if (!put.ok) throw new Error(`Upload to storage failed (${put.status})`);
  const { data } = await farmApi.post(`/fields/${fieldId}/photos`, { key: presign.key });
  return data;
}
