// Browser-side agronomy models. They mirror the server models so every tool keeps
// working on a static deployment (e.g. Vercel) where the FastAPI service is absent.
// Models are exported by scripts/export_browser_models.py from the bundled datasets.
import recommendModel from "@/data/generated/recommendModel.json";
import yieldModel from "@/data/generated/yieldModel.json";
import { CROP_PROFILES } from "@/data/cropProfiles";

// ---------------------------------------------------------------- yield

/** Crops, states and seasons the yield model has seen. */
export const YIELD_DOMAIN = (() => {
  const states = new Set();
  const crops = new Set();
  const seasons = new Set();
  for (const key of Object.keys(yieldModel.groups)) {
    const [s, c, se] = key.split("|");
    states.add(s);
    crops.add(c);
    seasons.add(se);
  }
  return { states: [...states].sort(), crops: [...crops].sort(), seasons: [...seasons].sort() };
})();

export function seasonsFor(state, crop) {
  return YIELD_DOMAIN.seasons.filter((s) => yieldModel.groups[`${state}|${crop}|${s}`]);
}

/**
 * Log-linear yield model: state/crop/season baseline + crop trend + rainfall elasticity.
 * Returns t/ha plus historical quartiles for the same state, crop and season.
 */
export function predictYieldLocal({ state, crop, season, year, area_ha, annual_rainfall }) {
  const c = yieldModel.crops[crop];
  if (!c) throw new Error(`No yield records for ${crop}.`);
  const group = yieldModel.groups[`${state}|${crop}|${season}`];
  let base;
  let meanRain;
  let history = null;
  if (group) {
    [base, meanRain] = group;
    history = { n: group[2], p25: group[3], median: group[4], p75: group[5] };
  } else {
    base = yieldModel.state_crop[`${state}|${crop}`] ?? c.base;
    meanRain = yieldModel.state_rain[state] ?? 7;
  }
  let logY = base + c.trend * (year - yieldModel.ref_year);
  if (annual_rainfall) logY += c.rain * (Math.log(annual_rainfall) - meanRain);
  const y = Math.exp(logY);
  return {
    model: "AgriSmart browser model (log-linear, trend + rainfall)",
    yield_t_ha: round(y, 3),
    production_t: round(y * area_ha, 2),
    // ±1 standard error in log space from the held-out evaluation, as a planning band.
    low_t_ha: round(y * Math.exp(-0.46), 3),
    high_t_ha: round(y * Math.exp(0.46), 3),
    typical_rain_mm: Math.round(Math.exp(meanRain)),
    rain_elasticity: c.rain,
    trend_pct_per_year: round(c.trend * 100, 2),
    history,
    exact_match: Boolean(group),
  };
}

/** Yield response across a rainfall range, for the sensitivity chart. */
export function rainfallSensitivity(input) {
  const base = predictYieldLocal({ ...input, annual_rainfall: undefined });
  const typical = base.typical_rain_mm;
  return [0.5, 0.65, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6].map((f) => {
    const rain = Math.round(typical * f);
    return { rain, yield: predictYieldLocal({ ...input, annual_rainfall: rain }).yield_t_ha };
  });
}

// ---------------------------------------------------------------- crop recommendation

/** Gaussian Naive Bayes over N, P, K, temperature, humidity, pH and rainfall (22 crops). */
export function recommendLocal(soil, k = 3) {
  const { features, classes, means, vars, priors } = recommendModel;
  const x = features.map((f) => Number(soil[f]));
  const logp = classes.map(
    (_, i) =>
      Math.log(priors[i]) +
      x.reduce((sum, v, j) => {
        const variance = vars[i][j] + 1e-9;
        return sum - 0.5 * Math.log(2 * Math.PI * variance) - (v - means[i][j]) ** 2 / (2 * variance);
      }, 0),
  );
  const max = Math.max(...logp);
  const exp = logp.map((l) => Math.exp(l - max));
  const total = exp.reduce((a, b) => a + b, 0);
  return {
    method: "ml-model",
    engine: "browser",
    top: classes
      .map((crop, i) => ({
        crop,
        confidence: exp[i] / total,
        season: CROP_PROFILES[crop]?.season ?? "kharif",
        category: CROP_PROFILES[crop]?.category ?? "crop",
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, k),
  };
}

// ---------------------------------------------------------------- fertilizer

const TOLERANCE = 0.1;
export function fertilizerLocal({ crop, N, P, K, area_ha = 1 }) {
  const profile = CROP_PROFILES[crop?.toLowerCase()];
  if (!profile) throw new Error(`Unknown crop: ${crop}`);
  const gap = (nutrient, current, target) => ({
    nutrient,
    current,
    target,
    deficit: round(Math.max(target - current, 0), 2),
    status: current < target * (1 - TOLERANCE) ? "low" : current > target * (1 + TOLERANCE) ? "high" : "ok",
  });
  const gaps = [gap("N", N, profile.N), gap("P", P, profile.P), gap("K", K, profile.K)];
  const [nDef, pDef, kDef] = gaps.map((g) => (g.status === "low" ? g.deficit : 0));
  const dap = pDef / 0.46;
  const urea = Math.max(nDef - dap * 0.18, 0) / 0.46;
  const mop = kDef / 0.6;
  const doses = [
    ["DAP (18-46-0)", dap],
    ["Urea (46-0-0)", urea],
    ["MOP (0-0-60)", mop],
  ]
    .filter(([, kg]) => kg > 0)
    .map(([product, kg]) => ({ product, kg_per_ha: round(kg, 1), total_kg: round(kg * area_ha, 1) }));
  const advice = [];
  if (!doses.length) advice.push("Soil N-P-K already meets the crop's needs; no fertilizer required.");
  if (urea > 0) advice.push("Split urea into 2-3 doses (basal, tillering/vegetative, flowering) to reduce losses.");
  if (dap > 0) advice.push("Apply DAP as a basal dose at sowing, placed near the root zone.");
  if (mop > 0) advice.push("Apply MOP as basal; on sandy soils split it into two doses.");
  gaps
    .filter((g) => g.status === "high")
    .forEach((g) =>
      advice.push(`${g.nutrient} is above target; skip extra ${g.nutrient} to avoid wastage and runoff.`),
    );
  return { crop: profile.name, area_ha, gaps, doses, advice };
}

// ---------------------------------------------------------------- soil health (Soil Health Card ratings)

export const SOIL_RATINGS = {
  N: { unit: "kg/ha", low: 280, high: 560, ideal: 420, max: 800, label: "Nitrogen (N)" },
  P: { unit: "kg/ha", low: 10, high: 25, ideal: 20, max: 60, label: "Phosphorus (P)" },
  K: { unit: "kg/ha", low: 110, high: 280, ideal: 220, max: 500, label: "Potassium (K)" },
  oc: { unit: "%", low: 0.5, high: 0.75, ideal: 0.8, max: 2, label: "Organic carbon" },
};

export function rateNutrient(key, value) {
  const r = SOIL_RATINGS[key];
  return value < r.low ? "low" : value > r.high ? "high" : "medium";
}

export function soilHealth({ N, P, K, oc, ph, ec }) {
  const score = (key, v) => {
    const r = SOIL_RATINGS[key];
    if (v < r.low) return Math.max(15, (v / r.low) * 60);
    if (v <= r.high) return 60 + ((v - r.low) / (r.high - r.low)) * 40;
    return Math.max(70, 100 - ((v - r.high) / r.high) * 40);
  };
  const phScore = ph >= 6.5 && ph <= 7.5 ? 100 : Math.max(20, 100 - Math.abs(ph - 7) * 30);
  const ecScore = ec < 1 ? 100 : ec < 3 ? 60 : 25;
  const parts = { N: score("N", N), P: score("P", P), K: score("K", K), oc: score("oc", oc), ph: phScore, ec: ecScore };
  const weights = { N: 0.2, P: 0.18, K: 0.17, oc: 0.2, ph: 0.15, ec: 0.1 };
  const total = Object.entries(parts).reduce((s, [k, v]) => s + v * weights[k], 0);
  const issues = [];
  if (rateNutrient("N", N) === "low")
    issues.push({
      key: "N",
      text: "Nitrogen is low: apply urea in splits, add FYM/compost or grow a legume green manure (dhaincha, sunhemp).",
    });
  if (rateNutrient("P", P) === "low")
    issues.push({
      key: "P",
      text: "Phosphorus is low: apply DAP/SSP as basal; use PSB biofertilizer with seed treatment.",
    });
  if (rateNutrient("K", K) === "low")
    issues.push({ key: "K", text: "Potassium is low: apply MOP as basal; recycle crop residues instead of burning." });
  if (rateNutrient("oc", oc) === "low")
    issues.push({
      key: "oc",
      text: "Organic carbon is low: add 5–10 t/ha FYM or vermicompost, mulch and avoid residue burning.",
    });
  if (ph < 5.5)
    issues.push({
      key: "ph",
      text: "Soil is strongly acidic: apply agricultural lime (dose per lab test) 2–3 weeks before sowing.",
    });
  else if (ph < 6.5)
    issues.push({
      key: "ph",
      text: "Soil is slightly acidic: suits rice, tea, potato; lime only for sensitive crops.",
    });
  else if (ph > 8.5)
    issues.push({
      key: "ph",
      text: "Soil is sodic/alkaline: apply gypsum as per gypsum requirement and leach with good water.",
    });
  else if (ph > 7.5)
    issues.push({
      key: "ph",
      text: "Soil is mildly alkaline: use acidifying fertilizers (ammonium sulphate) and organic matter.",
    });
  if (ec >= 1)
    issues.push({
      key: "ec",
      text: "Salinity is elevated: improve drainage, leach salts and choose salt-tolerant crops (barley, cotton, mustard).",
    });
  return {
    score: Math.round(total),
    parts,
    issues,
    grade: total >= 80 ? "excellent" : total >= 65 ? "good" : total >= 45 ? "average" : "poor",
  };
}

// ---------------------------------------------------------------- irrigation (FAO-56)

// Crop coefficients Kc for [initial, development, mid-season, late] stages (FAO-56 Table 12).
export const KC = {
  Rice: [1.05, 1.1, 1.2, 0.9],
  Wheat: [0.4, 0.8, 1.15, 0.4],
  Maize: [0.3, 0.8, 1.2, 0.6],
  Sugarcane: [0.4, 0.9, 1.25, 0.75],
  Cotton: [0.35, 0.8, 1.15, 0.7],
  Soybean: [0.4, 0.8, 1.15, 0.5],
  Groundnut: [0.4, 0.8, 1.15, 0.6],
  Chickpea: [0.4, 0.7, 1.0, 0.35],
  Mustard: [0.35, 0.75, 1.1, 0.35],
  Potato: [0.5, 0.8, 1.15, 0.75],
  Onion: [0.7, 0.85, 1.05, 0.75],
  Tomato: [0.6, 0.85, 1.15, 0.8],
  Banana: [0.5, 0.9, 1.1, 1.0],
  Bajra: [0.3, 0.7, 1.0, 0.3],
  "Pulses (moong/urad)": [0.4, 0.7, 1.05, 0.35],
  Vegetables: [0.6, 0.8, 1.05, 0.9],
  Orchard: [0.6, 0.75, 0.9, 0.75],
};
export const STAGES = ["Initial", "Development", "Mid-season", "Late"];
export const METHODS = { Flood: 0.6, Furrow: 0.7, Sprinkler: 0.75, Drip: 0.9 };

/**
 * Net and gross irrigation over a window from reference evapotranspiration (ET0, mm/day)
 * and rainfall (mm/day). Effective rain uses a simple 80% factor above 5 mm/day.
 */
export function irrigationPlan({ crop, stage, et0, rain, areaHa, method }) {
  const kc = (KC[crop] || KC.Vegetables)[STAGES.indexOf(stage)] ?? 1;
  const days = et0.map((e, i) => {
    const etc = e * kc;
    const r = rain[i] ?? 0;
    const eff = r > 5 ? r * 0.8 : 0;
    return { etc: round(etc, 2), rain: round(r, 1), effective: round(eff, 1), net: round(Math.max(etc - eff, 0), 2) };
  });
  const etcTotal = days.reduce((s, d) => s + d.etc, 0);
  const effTotal = days.reduce((s, d) => s + d.effective, 0);
  const net = Math.max(etcTotal - effTotal, 0);
  const efficiency = METHODS[method] ?? 0.7;
  const gross = net / efficiency;
  return {
    kc,
    days,
    etcTotal: round(etcTotal, 1),
    effectiveRain: round(effTotal, 1),
    netMm: round(net, 1),
    grossMm: round(gross, 1),
    volumeM3: Math.round(gross * areaHa * 10), // 1 mm over 1 ha = 10 m³
    byMethod: Object.entries(METHODS).map(([m, e]) => ({ method: m, m3: Math.round((net / e) * areaHa * 10) })),
  };
}

// ---------------------------------------------------------------- leaf image screening

/**
 * Colour-based leaf screening on a downscaled image. Classifies plant pixels into
 * healthy green, chlorotic (yellow), necrotic (brown), dark lesions and white/powdery,
 * and reports the share of each. This is a screening signal, not a diagnosis.
 */
export function analyzeLeafPixels(data) {
  const counts = { healthy: 0, yellow: 0, brown: 0, dark: 0, white: 0 };
  let plant = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 510;
    const s = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    let h = 0;
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min)) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    // Skip likely background: very low saturation mid-greys and blue sky/backdrops.
    if (l > 0.82 && s < 0.25) {
      counts.white += 1;
      plant += 1;
      continue;
    }
    if (s < 0.15 && l > 0.25) continue;
    if (h > 180 && h < 300) continue;
    plant += 1;
    if (l < 0.16) counts.dark += 1;
    else if (h >= 70 && h <= 170) counts.healthy += 1;
    else if (h >= 45 && h < 70) counts.yellow += 1;
    else if (h < 45 || h >= 300) counts[l < 0.45 ? "brown" : "yellow"] += 1;
    else counts.healthy += 1;
  }
  const pct = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, plant ? round((v / plant) * 100, 1) : 0]));
  const stress = pct.yellow + pct.brown + pct.dark + pct.white * 0.8;
  return { pct, plantPixels: plant, healthIndex: Math.max(0, Math.round(100 - stress * 1.4)) };
}

function round(v, d = 2) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
