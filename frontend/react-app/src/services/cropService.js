import { api } from "./apiClient";

// Crops & recommendations (FastAPI + the trained ML model)

export async function fetchCrops(season) {
  const { data } = await api.get("/crops", { params: season ? { season } : undefined });
  return data;
}

export async function fetchCrop(name) {
  const { data } = await api.get(`/crops/${encodeURIComponent(name)}`);
  return data;
}

export async function recommendCrop(soil) {
  const { data } = await api.post("/recommend/crop", soil);
  return data;
}

export async function recommendFertilizer(request) {
  const { data } = await api.post("/recommend/fertilizer", request);
  return data;
}

// Saved history & background jobs (signed-in users)

export async function fetchPredictions(limit = 10, offset = 0) {
  const { data } = await api.get("/predictions", { params: { limit, offset } });
  return data;
}

export async function fetchPredictionStats() {
  const { data } = await api.get("/predictions/stats");
  return data;
}

export async function uploadBatchCsv(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/jobs/batch-csv", form);
  return data;
}

export async function fetchJob(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}
