// Types mirror the Pydantic schemas in backend/app/schemas/__init__.py

export type Season = "kharif" | "rabi" | "zaid" | "perennial";

export interface Crop {
  name: string;
  season: Season;
  category: string;
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface SoilConditions {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropScore {
  crop: string;
  confidence: number;
  season: Season | "unknown";
  category: string;
}

export interface CropRecommendation {
  method: "ml-model" | "profile-similarity";
  top: CropScore[];
}

export interface FertilizerRequest {
  crop: string;
  N: number;
  P: number;
  K: number;
  area_ha: number;
}

export interface NutrientGap {
  nutrient: "N" | "P" | "K";
  current: number;
  target: number;
  deficit: number;
  status: "low" | "ok" | "high";
}

export interface FertilizerDose {
  product: string;
  kg_per_ha: number;
  total_kg: number;
}

export interface FertilizerRecommendation {
  crop: string;
  area_ha: number;
  gaps: NutrientGap[];
  doses: FertilizerDose[];
  advice: string[];
}
