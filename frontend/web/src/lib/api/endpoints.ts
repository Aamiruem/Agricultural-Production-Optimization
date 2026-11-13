import { api } from "./client";
import type {
  Crop,
  CropRecommendation,
  FertilizerRecommendation,
  FertilizerRequest,
  SoilConditions,
} from "./types";

// Client-side API calls (Axios). Used through TanStack Query hooks.

export async function fetchCrops(): Promise<Crop[]> {
  const { data } = await api.get<Crop[]>("/crops");
  return data;
}

export async function recommendCrop(soil: SoilConditions): Promise<CropRecommendation> {
  const { data } = await api.post<CropRecommendation>("/recommend/crop", soil);
  return data;
}

export async function recommendFertilizer(
  req: FertilizerRequest,
): Promise<FertilizerRecommendation> {
  const { data } = await api.post<FertilizerRecommendation>("/recommend/fertilizer", req);
  return data;
}
