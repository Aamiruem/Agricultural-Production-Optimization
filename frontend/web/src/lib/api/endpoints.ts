import { api, farmApi } from "./client";
import type {
  Activity,
  ActivityType,
  AssistantStatus,
  BatchJob,
  Crop,
  CropCount,
  CropRecommendation,
  Farm,
  FarmField,
  FarmSummary,
  FertilizerRecommendation,
  FertilizerRequest,
  ModelInfo,
  PredictionPage,
  SoilConditions,
  TokenResponse,
} from "./types";

// Client-side API calls (Axios). Used through TanStack Query hooks.

// ---------------------------------------------------- FastAPI: crops & ML
export async function fetchCrops(): Promise<Crop[]> {
  const { data } = await api.get<Crop[]>("/crops");
  return data;
}

export async function recommendCrop(soil: SoilConditions): Promise<CropRecommendation> {
  const { data } = await api.post<CropRecommendation>("/recommend/crop", soil);
  return data;
}

export async function recommendFertilizer(req: FertilizerRequest): Promise<FertilizerRecommendation> {
  const { data } = await api.post<FertilizerRecommendation>("/recommend/fertilizer", req);
  return data;
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const { data } = await api.get<ModelInfo>("/ml/model");
  return data;
}

// ---------------------------------------------------------- FastAPI: auth
export async function register(body: { email: string; password: string; full_name: string }) {
  const { data } = await api.post<TokenResponse>("/auth/register", body);
  return data;
}

/** OAuth 2.0 password grant (form-encoded, as the spec requires). */
export async function login(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password });
  const { data } = await api.post<TokenResponse>("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

// --------------------------------------------------- FastAPI: history/jobs
export async function fetchPredictions(limit = 10, offset = 0): Promise<PredictionPage> {
  const { data } = await api.get<PredictionPage>("/predictions", { params: { limit, offset } });
  return data;
}

export async function fetchPredictionStats(): Promise<CropCount[]> {
  const { data } = await api.get<CropCount[]>("/predictions/stats");
  return data;
}

export async function uploadBatchCsv(file: File): Promise<BatchJob> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<BatchJob>("/jobs/batch-csv", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchJob(id: string): Promise<BatchJob> {
  const { data } = await api.get<BatchJob>(`/jobs/${id}`);
  return data;
}

// ----------------------------------------------------- FastAPI: assistant
export async function fetchAssistantStatus(): Promise<AssistantStatus> {
  const { data } = await api.get<AssistantStatus>("/assistant/status");
  return data;
}

// ------------------------------------------------ Node farm-service (Mongo)
export async function fetchFarms(): Promise<Farm[]> {
  const { data } = await farmApi.get<Farm[]>("/farms");
  return data;
}

export async function createFarm(body: { name: string; location?: { state?: string; district?: string } }) {
  const { data } = await farmApi.post<Farm>("/farms", body);
  return data;
}

export async function deleteFarm(id: string) {
  await farmApi.delete(`/farms/${id}`);
}

export async function fetchFarmSummary(id: string): Promise<FarmSummary> {
  const { data } = await farmApi.get<FarmSummary>(`/farms/${id}/summary`);
  return data;
}

export async function fetchFields(farmId: string): Promise<FarmField[]> {
  const { data } = await farmApi.get<FarmField[]>(`/farms/${farmId}/fields`);
  return data;
}

export type NewField = Pick<FarmField, "name" | "crop" | "season" | "areaHa"> & { soil?: FarmField["soil"] };

export async function createField(farmId: string, body: NewField) {
  const { data } = await farmApi.post<FarmField>(`/farms/${farmId}/fields`, body);
  return data;
}

export async function deleteField(id: string) {
  await farmApi.delete(`/fields/${id}`);
}

export async function logActivity(fieldId: string, body: { type: ActivityType; notes?: string }) {
  const { data } = await farmApi.post<Activity>(`/fields/${fieldId}/activities`, body);
  return data;
}

export async function fieldFertilizerPlan(fieldId: string): Promise<FertilizerRecommendation> {
  const { data } = await farmApi.post<FertilizerRecommendation>(`/fields/${fieldId}/fertilizer-plan`);
  return data;
}

/** Presign → PUT straight to S3 → record the key on the field. */
export async function uploadFieldPhoto(fieldId: string, file: File): Promise<FarmField> {
  const { data: presign } = await farmApi.post<{ key: string; uploadUrl: string; headers: Record<string, string> }>(
    `/fields/${fieldId}/photos/presign`,
    { contentType: file.type, size: file.size },
  );
  const put = await fetch(presign.uploadUrl, { method: "PUT", headers: presign.headers, body: file });
  if (!put.ok) throw new Error(`Upload to storage failed (${put.status})`);
  const { data } = await farmApi.post<FarmField>(`/fields/${fieldId}/photos`, { key: presign.key });
  return data;
}
