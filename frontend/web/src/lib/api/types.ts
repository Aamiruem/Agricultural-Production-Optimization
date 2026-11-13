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

// ---------------------------------------------------------------- auth
export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "farmer";
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
}

// ------------------------------------------------------------- history
export interface Prediction extends SoilConditions {
  id: number;
  top_crop: string;
  confidence: number;
  method: string;
  source: "api" | "batch";
  created_at: string;
}

export interface PredictionPage {
  items: Prediction[];
  total: number;
  limit: number;
  offset: number;
}

export interface CropCount {
  crop: string;
  count: number;
  avg_confidence: number;
}

export interface BatchJob {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  total_rows: number;
  result: ({ row: number; top: CropScore[]; method: string } & SoilConditions)[] | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

// ------------------------------------------------------------------ ML
export interface ModelMetrics {
  cv_accuracy_mean?: number;
  cv_f1_macro_mean?: number;
  cv_f1_macro_std?: number;
  test_accuracy: number;
  test_f1_macro: number;
  test_precision_macro: number;
  test_recall_macro: number;
}

export interface ModelInfo {
  serving: { method: string; model: string | null; trained_at: string | null; metrics: Partial<ModelMetrics> };
  report: {
    best_model: string;
    trained_at: string;
    rows: number;
    classes: string[];
    features: string[];
    leaderboard: Record<string, ModelMetrics>;
    feature_importances: Record<string, number> | null;
  } | null;
}

// ----------------------------------------------------------- assistant
export interface AssistantStatus {
  llm_available: boolean;
  llm_reason: string;
  model: string;
  agent_runtime: string;
  vector_store: string;
  embedder: string;
  documents: number;
}

export interface Source {
  source: string;
  title: string;
}

export type ChatEvent =
  | { type: "token"; text: string }
  | { type: "tool"; name: string; input: unknown }
  | { type: "tool_result"; name: string; is_error: boolean }
  | { type: "sources"; sources: Source[] }
  | { type: "notice"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

// --------------------------------------------------- farm service (Node)
export type FieldStatus = "planned" | "sown" | "growing" | "harvested";
export type ActivityType = "sowing" | "irrigation" | "fertilizer" | "pesticide" | "harvest" | "note";

export interface Farm {
  _id: string;
  name: string;
  location?: { state?: string; district?: string };
  fields?: number;
  areaHa?: number;
  createdAt: string;
}

export interface FarmField {
  _id: string;
  farmId: string;
  name: string;
  crop: string;
  season: Season;
  areaHa: number;
  status: FieldStatus;
  soil?: { N?: number; P?: number; K?: number; ph?: number };
  photos: { key: string; url: string; uploadedAt: string }[];
}

export interface Activity {
  _id: string;
  fieldId: string;
  fieldName?: string;
  type: ActivityType;
  notes?: string;
  quantity?: number;
  unit?: string;
  date: string;
}

export interface FarmSummary {
  farm: Farm;
  totals: { fields: number; areaHa: number };
  byCrop: { crop: string; fields: number; areaHa: number }[];
  byStatus: Partial<Record<FieldStatus, number>>;
  recentActivities: Activity[];
}
