/** Crop names known to the backend (and the ML model's 22 classes). */
export const CROP_NAMES = [
  "rice",
  "maize",
  "chickpea",
  "kidneybeans",
  "pigeonpeas",
  "mothbeans",
  "mungbean",
  "blackgram",
  "lentil",
  "pomegranate",
  "banana",
  "mango",
  "grapes",
  "watermelon",
  "muskmelon",
  "apple",
  "orange",
  "papaya",
  "coconut",
  "cotton",
  "jute",
  "coffee",
];

export const SEASONS = [
  { value: "kharif", label: "Kharif", months: "Jun – Oct (monsoon)" },
  { value: "rabi", label: "Rabi", months: "Oct – Mar (winter)" },
  { value: "zaid", label: "Zaid", months: "Mar – Jun (summer)" },
  { value: "perennial", label: "Perennial", months: "All year" },
];

const DISPLAY_NAMES = {
  kidneybeans: "Kidney beans",
  pigeonpeas: "Pigeon peas",
  mothbeans: "Moth beans",
  mungbean: "Mung bean",
  blackgram: "Black gram",
};

export function formatCropName(name = "") {
  const key = name.trim().toLowerCase();
  return DISPLAY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function seasonLabel(season) {
  return SEASONS.find((s) => s.value === season)?.label ?? "Unknown";
}

/** Example soil readings so people can try the forms quickly. */
export const SAMPLE_SOILS = [
  {
    label: "Wet paddy field",
    values: { N: 85, P: 45, K: 40, temperature: 23.5, humidity: 82, ph: 6.5, rainfall: 230 },
  },
  { label: "Dry rabi plot", values: { N: 40, P: 65, K: 78, temperature: 19, humidity: 18, ph: 7.2, rainfall: 80 } },
  { label: "Humid orchard", values: { N: 100, P: 80, K: 50, temperature: 27, humidity: 80, ph: 6, rainfall: 105 } },
];

export const FEATURE_NAMES = {
  N: "Nitrogen (N)",
  P: "Phosphorus (P)",
  K: "Potassium (K)",
  ph: "Soil pH",
  temperature: "Temperature",
  humidity: "Humidity",
  rainfall: "Rainfall",
};

export const MODEL_NAMES = {
  logistic_regression: "Logistic regression",
  random_forest: "Random forest",
  xgboost: "XGBoost",
  pytorch_mlp: "PyTorch MLP",
};
