// Soil intelligence: SoilGrids parsing, texture class, water-holding estimate,
// regional soil classes and Soil Health Card (user) values. Pure helpers + fetcher.
import { ATLAS_STATES } from "@/lib/atlas";
import { STATE_BY_NAME } from "@/data/indiaAgri";

import { round } from "./geo";
import { missing, sv } from "./sources";

export const SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";
export const SOILGRIDS_PROPS = ["phh2o", "clay", "sand", "silt", "soc", "nitrogen", "cec", "bdod"];
const DEPTHS = [
  ["0-5cm", 5],
  ["5-15cm", 10],
  ["15-30cm", 15],
];

/** Depth-weighted (0–30 cm) mean of a SoilGrids layer in target units, or null when masked. */
export function soilgridsLayer(json, name) {
  const layer = json?.properties?.layers?.find((l) => l.name === name);
  if (!layer) return null;
  const d = layer.unit_measure?.d_factor || 1;
  let total = 0;
  let w = 0;
  for (const [label, thickness] of DEPTHS) {
    const v = layer.depths.find((x) => x.label === label)?.values?.mean;
    if (v == null) continue;
    total += (v / d) * thickness;
    w += thickness;
  }
  return w ? total / w : null;
}

/** USDA soil texture class from sand/silt/clay percentages. */
export function usdaTexture(sand, silt, clay) {
  if ([sand, silt, clay].some((v) => v == null)) return null;
  if (silt + 1.5 * clay < 15) return "Sand";
  if (silt + 2 * clay < 30) return "Loamy sand";
  if ((clay >= 7 && clay < 20 && sand > 52) || (clay < 7 && silt < 50)) return "Sandy loam";
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) return "Loam";
  if ((silt >= 50 && clay >= 12 && clay < 27) || (silt >= 50 && silt < 80 && clay < 12)) return "Silt loam";
  if (silt >= 80 && clay < 12) return "Silt";
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return "Sandy clay loam";
  if (clay >= 27 && clay < 40 && sand > 20 && sand <= 45) return "Clay loam";
  if (clay >= 27 && clay < 40 && sand <= 20) return "Silty clay loam";
  if (clay >= 35 && sand > 45) return "Sandy clay";
  if (clay >= 40 && silt >= 40) return "Silty clay";
  return "Clay";
}

/**
 * Available water capacity (mm per metre of soil) from Saxton & Rawls (2006)
 * pedotransfer functions. Inputs in %; an estimate, not a measurement.
 */
export function availableWaterMmPerM(sandPct, clayPct, organicMatterPct) {
  if ([sandPct, clayPct, organicMatterPct].some((v) => v == null)) return null;
  const S = sandPct / 100;
  const C = clayPct / 100;
  const OM = Math.min(organicMatterPct, 8);
  const t1500 = -0.024 * S + 0.487 * C + 0.006 * OM + 0.005 * S * OM - 0.013 * C * OM + 0.068 * S * C + 0.031;
  const wp = t1500 + (0.14 * t1500 - 0.02);
  const t33 = -0.251 * S + 0.195 * C + 0.011 * OM + 0.006 * S * OM - 0.027 * C * OM + 0.452 * S * C + 0.299;
  const fc = t33 + (1.283 * t33 * t33 - 0.374 * t33 - 0.015);
  return Math.max(0, (fc - wp) * 1000);
}

const DRAINAGE = {
  Sand: "Rapid (excessive)",
  "Loamy sand": "Rapid",
  "Sandy loam": "Well drained",
  Loam: "Well drained",
  "Silt loam": "Moderately well drained",
  Silt: "Moderately well drained",
  "Sandy clay loam": "Moderately well drained",
  "Clay loam": "Moderate",
  "Silty clay loam": "Moderate to slow",
  "Sandy clay": "Slow",
  "Silty clay": "Slow (waterlogging-prone)",
  Clay: "Slow (waterlogging-prone)",
};

export const drainageFromTexture = (texture) => DRAINAGE[texture] ?? null;

/** Regional soil classes for a state from the AgriSmart reference tables. */
export function regionalSoils(state) {
  const atlas = ATLAS_STATES[state]?.soils;
  const india = STATE_BY_NAME[state]?.soils;
  const list = atlas?.length ? atlas : Array.isArray(india) ? india : [];
  return list.length
    ? sv(list, null, "atlas", { type: "reference", resolution: "state (regional classes)", confidence: "low" })
    : missing(null, "No regional soil reference for this state.", { source: "atlas" });
}

/** Turn a SoilGrids JSON response into sourced soil values. */
export function parseSoilgrids(json, { sampledAt, offsetKm = 0 } = {}) {
  const val = (name) => soilgridsLayer(json, name);
  const sand = val("sand");
  const silt = val("silt");
  const clay = val("clay");
  const soc = val("soc"); // g/kg
  const n = val("nitrogen"); // g/kg (total N)
  const ph = val("phh2o");
  const cec = val("cec");
  const bdod = val("bdod");
  const resolution = offsetKm ? `250 m grid cell ${round(offsetKm, 1)} km from your point (your point is masked, e.g. built-up)` : "250 m grid cell";
  const meta = { type: "modelled", resolution, observedAt: "SoilGrids 2.0 (2020 release)", confidence: "medium", note: "0–30 cm depth-weighted mean" };
  const pick = (v, unit, digits = 1, extra = {}) => (v == null ? missing(unit, "Not available at this location in SoilGrids (masked or no data).", { source: "soilgrids" }) : sv(round(v, digits), unit, "soilgrids", { ...meta, ...extra }));
  const texture = usdaTexture(sand, silt, clay);
  const om = soc == null ? null : (soc / 10) * 1.724;
  const awc = availableWaterMmPerM(sand, clay, om);
  return {
    ph: pick(ph, "pH", 1),
    sand: pick(sand, "%", 0),
    silt: pick(silt, "%", 0),
    clay: pick(clay, "%", 0),
    organicCarbon: pick(soc == null ? null : soc / 10, "%", 2, { note: "Soil organic carbon, 0–30 cm" }),
    totalNitrogen: pick(n, "g/kg", 2, { note: "Total nitrogen — not the same as Soil Health Card 'available N' (kg/ha)" }),
    cec: pick(cec, "cmol(+)/kg", 1),
    bulkDensity: pick(bdod, "g/cm³", 2),
    texture: texture ? sv(texture, null, "derived", { type: "estimated", resolution, note: "USDA texture class from SoilGrids sand/silt/clay" }) : missing(null, "Texture needs sand, silt and clay.", { source: "derived" }),
    waterHolding: awc == null ? missing("mm/m", "Needs sand, clay and organic carbon.", { source: "derived" }) : sv(round(awc, 0), "mm per m", "derived", { type: "estimated", resolution, note: "Saxton & Rawls (2006) pedotransfer estimate" }),
    drainage: texture ? sv(drainageFromTexture(texture), null, "derived", { type: "estimated", resolution, note: "Inferred from texture class" }) : missing(null, "Needs texture.", { source: "derived" }),
    sampledAt: sampledAt ?? null,
    offsetKm,
  };
}

// Soil Health Card critical limits (DTPA / hot-water extractable, ppm) widely used in India.
export const MICRO_LIMITS = { S: 10, Zn: 0.6, Fe: 4.5, B: 0.5 };

/** Sourced values from a user's Soil Health Card / lab report. */
export function userSoilValues(card = {}) {
  const out = {};
  const units = { N: "kg/ha", P: "kg/ha", K: "kg/ha", ph: "pH", ec: "dS/m", oc: "%", S: "ppm", Zn: "ppm", Fe: "ppm", B: "ppm", moisture: "%" };
  for (const [key, unit] of Object.entries(units)) {
    const v = card[key];
    if (v === "" || v == null || Number.isNaN(Number(v))) continue;
    out[key] = sv(Number(v), unit, "user", { type: "measured", resolution: "your field (sample)", observedAt: card.sampleDate || null, confidence: "high" });
  }
  return out;
}

/** Ratings for micronutrients and salinity/alkalinity indicators from user values. */
export function soilIndicators({ ph, ec, micro = {} }) {
  const out = [];
  if (ph != null) {
    if (ph > 8.5) out.push({ key: "alkalinity", label: "Alkaline / possibly sodic", detail: `pH ${ph} > 8.5` });
    else if (ph < 5.5) out.push({ key: "acidity", label: "Strongly acidic", detail: `pH ${ph} < 5.5` });
  }
  if (ec != null && ec >= 1) out.push({ key: "salinity", label: ec >= 4 ? "Saline" : "Salinity building up", detail: `EC ${ec} dS/m` });
  for (const [k, limit] of Object.entries(MICRO_LIMITS)) {
    if (micro[k] != null) out.push({ key: k, label: `${k} ${micro[k] < limit ? "deficient" : "sufficient"}`, detail: `${micro[k]} ppm vs critical ${limit} ppm`, deficient: micro[k] < limit });
  }
  return out;
}
