import type { Season, SoilConditions } from "./api/types";

/** Crop names known to the backend; used for static params and the sitemap. */
export const CROP_NAMES = [
  "rice", "maize", "chickpea", "kidneybeans", "pigeonpeas", "mothbeans",
  "mungbean", "blackgram", "lentil", "pomegranate", "banana", "mango",
  "grapes", "watermelon", "muskmelon", "apple", "orange", "papaya",
  "coconut", "cotton", "jute", "coffee",
] as const;

export const SEASONS: { value: Season; label: string; months: string }[] = [
  { value: "kharif", label: "Kharif", months: "Jun – Oct (monsoon)" },
  { value: "rabi", label: "Rabi", months: "Oct – Mar (winter)" },
  { value: "zaid", label: "Zaid", months: "Mar – Jun (summer)" },
  { value: "perennial", label: "Perennial", months: "All year" },
];

const DISPLAY_NAMES: Record<string, string> = {
  kidneybeans: "Kidney beans",
  pigeonpeas: "Pigeon peas",
  mothbeans: "Moth beans",
  mungbean: "Mung bean",
  blackgram: "Black gram",
};

export function formatCropName(name: string): string {
  const key = name.trim().toLowerCase();
  if (DISPLAY_NAMES[key]) return DISPLAY_NAMES[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatPercent(value: number, digits = 0): string {
  const clamped = Math.min(Math.max(value, 0), 1);
  return `${(clamped * 100).toFixed(digits)}%`;
}

export function seasonLabel(season: string): string {
  return SEASONS.find((s) => s.value === season)?.label ?? "Unknown";
}

/** Example readings so users can try the forms quickly. */
export const SAMPLE_SOILS: { label: string; values: SoilConditions }[] = [
  {
    label: "Wet paddy field",
    values: { N: 85, P: 45, K: 40, temperature: 23.5, humidity: 82, ph: 6.5, rainfall: 230 },
  },
  {
    label: "Dry rabi plot",
    values: { N: 40, P: 65, K: 78, temperature: 19, humidity: 18, ph: 7.2, rainfall: 80 },
  },
  {
    label: "Humid orchard",
    values: { N: 100, P: 80, K: 50, temperature: 27, humidity: 80, ph: 6, rainfall: 105 },
  },
];
