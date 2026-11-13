import { CROP_PROFILES } from "@/data/cropProfiles";
import { fertilizerLocal, recommendLocal } from "@/lib/agriModels";

import { api, withFallback } from "./apiClient";

// Crops & recommendations (FastAPI + the trained ML model)

export function fetchCrops(season) {
  return withFallback(
    async () => (await api.get("/crops", { params: season ? { season } : undefined })).data,
    () => Object.values(CROP_PROFILES).filter((c) => !season || c.season === season),
  );
}

export function fetchCrop(name) {
  return withFallback(
    async () => (await api.get(`/crops/${encodeURIComponent(name)}`)).data,
    () => {
      const crop = CROP_PROFILES[name.toLowerCase()];
      if (!crop) throw new Error(`Unknown crop: ${name}`);
      return crop;
    },
  );
}

export function recommendCrop(soil) {
  return withFallback(async () => (await api.post("/recommend/crop", soil)).data, () => recommendLocal(soil));
}

export function recommendFertilizer(request) {
  return withFallback(async () => (await api.post("/recommend/fertilizer", request)).data, () => fertilizerLocal(request));
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
