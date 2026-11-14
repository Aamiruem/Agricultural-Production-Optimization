// Dataset ↔ local-area comparison and data-quality validation.
//
// Data Match Score = Σ (weight × similarity) / Σ (weights of comparable parameters) × 100
//
// * Missing values and values measured on a different basis are EXCLUDED from the score
//   (never counted as matches) and reported; "coverage" says how much of the total weight
//   could be compared.
// * This is a data-compatibility score. It is NOT the accuracy of any prediction.
//
// The Python service (backend/python-fastapi/app/services/local/matching.py) implements the
// same algorithm; shared/matching_cases.json keeps the two in agreement.
import { haversineKm, round } from "./geo";
import { median, normPlace, normSeason } from "./dataset";

export const DEFAULT_WEIGHTS = {
  location: 20,
  soil_type: 10,
  ph: 10,
  N: 6,
  P: 4,
  K: 4,
  oc: 4,
  rainfall: 12,
  temperature: 8,
  humidity: 6,
  crop: 8,
  season: 6,
  area: 2,
};

export const TOLERANCES = {
  ph: { abs: 1.0, unit: "pH" },
  N: { abs: 140, unit: "kg/ha" },
  P: { abs: 15, unit: "kg/ha" },
  K: { abs: 140, unit: "kg/ha" },
  oc: { abs: 0.5, unit: "%" },
  rainfall: { rel: 0.25, unit: "mm/year" },
  temperature: { abs: 4, unit: "°C" },
  humidity: { abs: 15, unit: "%" },
  area: { rel: 0.5, unit: "ha" },
  location: { km: 50 },
};

export const PARAM_LABELS = {
  location: "Location",
  soil_type: "Soil type",
  ph: "Soil pH",
  N: "Nitrogen (available)",
  P: "Phosphorus (available)",
  K: "Potassium (available)",
  oc: "Organic carbon",
  rainfall: "Annual rainfall",
  temperature: "Mean temperature",
  humidity: "Mean humidity",
  crop: "Crop types",
  season: "Season",
  area: "Land area",
};

// Regional soil classes ↔ USDA textures they typically show (for partial matches).
export const SOIL_FAMILY = {
  alluvial: ["Loam", "Silt loam", "Sandy loam", "Clay loam", "Silty clay loam"],
  black: ["Clay", "Silty clay", "Clay loam"],
  red: ["Sandy loam", "Sandy clay loam", "Loam", "Loamy sand"],
  laterite: ["Sandy clay loam", "Clay loam", "Sandy clay", "Clay"],
  arid: ["Sand", "Loamy sand", "Sandy loam"],
  desert: ["Sand", "Loamy sand", "Sandy loam"],
  sandy: ["Sand", "Loamy sand", "Sandy loam"],
  loamy: ["Loam", "Silt loam", "Sandy loam", "Clay loam"],
  clay: ["Clay", "Silty clay", "Clay loam", "Silty clay loam"],
  saline: [],
  peaty: ["Clay", "Silty clay", "Clay loam"],
  mountain: ["Loam", "Sandy loam", "Silt loam"],
  forest: ["Loam", "Sandy loam", "Silt loam"],
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
export function numericSimilarity(a, b, tol) {
  if (a == null || b == null) return null;
  const t = tol.abs ?? tol.rel * Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return clamp01(1 - Math.abs(a - b) / t);
}

function soilSimilarity(datasetSoil, localClasses = [], localTexture) {
  if (!datasetSoil || (!localClasses.length && !localTexture)) return null;
  const d = String(datasetSoil).toLowerCase();
  if (localClasses.some((c) => d.includes(String(c).toLowerCase()) || String(c).toLowerCase().includes(d))) return 1;
  if (localTexture && d === localTexture.toLowerCase()) return 1;
  const fam = Object.entries(SOIL_FAMILY).find(([k]) => d.includes(k));
  if (fam && localTexture && fam[1].includes(localTexture)) return 0.5;
  const localFamilies = localClasses.map(
    (c) => SOIL_FAMILY[Object.keys(SOIL_FAMILY).find((k) => String(c).toLowerCase().includes(k))] ?? [],
  );
  if (localFamilies.some((f) => f.some((t) => t.toLowerCase() === d))) return 0.5;
  return 0;
}

function cropSimilarity(datasetCrops = [], localCrops = []) {
  if (!datasetCrops.length || !localCrops.length) return null;
  const loc = new Set(localCrops.map((c) => cropKey(c)));
  const top = datasetCrops.slice(0, 10);
  return top.filter((c) => loc.has(cropKey(c))).length / top.length;
}

const CROP_SYNONYMS = {
  "arhar/tur": "pigeon pea",
  tur: "pigeon pea",
  arhar: "pigeon pea",
  pigeonpeas: "pigeon pea",
  gram: "chickpea",
  "rapeseed &mustard": "mustard",
  "rapeseed & mustard": "mustard",
  "moong(green gram)": "green gram",
  mungbean: "green gram",
  urad: "black gram",
  blackgram: "black gram",
  bajra: "pearl millet",
  jowar: "sorghum",
  ragi: "finger millet",
  paddy: "rice",
  "cotton(lint)": "cotton",
  masoor: "lentil",
  kidneybeans: "kidney beans",
  mothbeans: "moth bean",
  soyabean: "soybean",
  sesamum: "sesame",
  "dry chillies": "chilli",
  cashewnut: "cashew",
  "black pepper": "black pepper",
  "peas & beans (pulses)": "peas",
  "finger millet": "finger millet",
  "pearl millet": "pearl millet",
};
export function cropKey(name) {
  const s = String(name ?? "")
    .toLowerCase()
    .trim();
  return CROP_SYNONYMS[s] ?? s;
}

function seasonSimilarity(datasetSeasons = [], current) {
  if (!datasetSeasons.length || !current) return null;
  const set = new Set(datasetSeasons.map(normSeason));
  if (set.has(current)) return 1;
  if (set.has("Whole Year")) return 0.5;
  return 0;
}

function locationSimilarity(profile, local) {
  if (profile.lat != null && profile.lon != null && local.lat != null) {
    const d = haversineKm([profile.lat, profile.lon], [local.lat, local.lon]);
    return { s: clamp01(1 - d / TOLERANCES.location.km), distanceKm: round(d, 1), basis: "coordinates" };
  }
  if (profile.district && local.district && normPlace(profile.district) === normPlace(local.district))
    return { s: 0.85, basis: "same district" };
  if (profile.state && local.state && normPlace(profile.state) === normPlace(local.state))
    return { s: 0.6, basis: "same state (dataset has no finer location)" };
  if (profile.state || profile.district) return { s: 0, basis: "different area" };
  return null;
}

/** Representative values of matched dataset records (medians / modes / sets). */
export function datasetProfile(records, { level, latestYears = 5 } = {}) {
  if (!records?.length) return null;
  const years = records.map((r) => r.year).filter(Boolean);
  const latestYear = years.length ? Math.max(...years) : null;
  const recent = latestYear ? records.filter((r) => !r.year || r.year >= latestYear - (latestYears - 1)) : records;
  const med = (k) => {
    const v = median(recent.map((r) => r[k]));
    return v == null ? null : v;
  };
  const mode = (k) => {
    const c = new Map();
    for (const r of recent) if (r[k]) c.set(r[k], (c.get(r[k]) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  const cropArea = new Map();
  for (const r of recent) if (r.crop) cropArea.set(r.crop, (cropArea.get(r.crop) ?? 0) + (r.area ?? 1));
  // Annual rainfall: one value per year (repeated on every crop row in state datasets).
  const rainYear = new Map();
  for (const r of recent) if (r.rainfall != null && r.year) rainYear.set(r.year, r.rainfall);
  return {
    level,
    records: records.length,
    recentRecords: recent.length,
    latestYear,
    state: mode("state"),
    district: mode("district"),
    lat: med("lat"),
    lon: med("lon"),
    soil_type: mode("soil_type"),
    ph: med("ph"),
    N: med("N"),
    P: med("P"),
    K: med("K"),
    oc: med("oc"),
    rainfall: rainYear.size ? median([...rainYear.values()]) : med("rainfall"),
    temperature: med("temperature"),
    humidity: med("humidity"),
    area: med("area"),
    crops: [...cropArea.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c),
    seasons: [...new Set(recent.map((r) => normSeason(r.season)).filter(Boolean))],
  };
}

/**
 * Compare a dataset profile with local-area values.
 * `local` = { lat, lon, state, district, soilClasses[], texture, ph, N, P, K, oc, nBasis, rainfall,
 *             temperature, humidity, crops[], season, area, levels: {param: sourceLevel} }
 */
export function compareProfiles(profile, local, { weights = DEFAULT_WEIGHTS, now = new Date(), units = {} } = {}) {
  const rows = [];
  const add = (key, datasetValue, localValue, s, extra = {}) => {
    const w = Number(weights[key] ?? 0);
    let status;
    if (extra.notComparable) status = "not comparable";
    else if (s == null) status = "missing";
    else {
      const sr = round(s, 3); // classify on the reported (rounded) similarity
      status = sr >= 0.8 ? "match" : sr >= 0.5 ? "partial" : "mismatch";
    }
    rows.push({
      key,
      label: PARAM_LABELS[key] ?? key,
      dataset: datasetValue,
      local: localValue,
      similarity: status === "missing" || status === "not comparable" ? null : round(s, 3),
      status,
      weight: w,
      ...extra,
    });
  };

  const loc = profile ? locationSimilarity(profile, local) : null;
  add(
    "location",
    profile
      ? [profile.district, profile.state].filter(Boolean).join(", ") ||
          (profile.lat != null ? `${round(profile.lat, 4)}, ${round(profile.lon, 4)}` : null)
      : null,
    [local.district, local.state].filter(Boolean).join(", ") || null,
    loc?.s ?? null,
    { basis: loc?.basis, distanceKm: loc?.distanceKm },
  );

  add(
    "soil_type",
    profile?.soil_type ?? null,
    [local.texture, ...(local.soilClasses ?? [])].filter(Boolean).join(" / ") || null,
    soilSimilarity(profile?.soil_type, local.soilClasses, local.texture),
  );

  for (const key of ["ph", "N", "P", "K", "oc", "temperature", "humidity", "rainfall", "area"]) {
    const a = profile?.[key];
    const b = local[key];
    const tol = TOLERANCES[key];
    // Nutrients must be on the same basis (available kg/ha from a soil test).
    const notComparable =
      ["N", "P", "K"].includes(key) && b != null && local.nutrientBasis && local.nutrientBasis !== "available-kg-ha";
    const s = notComparable ? null : numericSimilarity(a, b, tol);
    add(key, a == null ? null : round(a, 2), b == null ? null : round(b, 2), s, {
      unit: units[key] ?? tol.unit,
      difference: a != null && b != null ? round(b - a, 2) : null,
      tolerance: tol.abs != null ? `±${tol.abs} ${tol.unit}` : `±${tol.rel * 100}%`,
      notComparable,
    });
  }

  add(
    "crop",
    profile?.crops?.slice(0, 6).join(", ") || null,
    local.crops?.slice(0, 6).join(", ") || null,
    cropSimilarity(profile?.crops, local.crops),
    { basis: "share of the dataset's top crops that are in the local crop list" },
  );
  add(
    "season",
    profile?.seasons?.join(", ") || null,
    local.season ?? null,
    seasonSimilarity(profile?.seasons, local.season),
  );

  const comparable = rows.filter((r) => r.similarity != null && r.weight > 0);
  const wTotal = rows.reduce((s, r) => s + (r.weight > 0 ? r.weight : 0), 0);
  const wUsed = comparable.reduce((s, r) => s + r.weight, 0);
  const score = wUsed ? (comparable.reduce((s, r) => s + r.weight * r.similarity, 0) / wUsed) * 100 : null;

  const age = profile?.latestYear ? now.getFullYear() - profile.latestYear : null;
  const temporal =
    age == null
      ? { level: "unknown", detail: "Dataset has no year column." }
      : age <= 2
        ? { level: "high", detail: `Latest record ${profile.latestYear} (${age} yr old).` }
        : age <= 6
          ? { level: "medium", detail: `Latest record ${profile.latestYear} (${age} yrs old).` }
          : { level: "low", detail: `Latest record ${profile.latestYear} (${age} yrs old) — outdated.` };
  const geographic =
    loc?.basis === "coordinates"
      ? {
          level: loc.distanceKm <= 5 ? "high" : loc.distanceKm <= 25 ? "medium" : "low",
          detail: `Dataset point ${loc.distanceKm} km away.`,
        }
      : loc?.basis === "same district"
        ? { level: "medium-high", detail: "Matched at district level." }
        : loc?.basis?.startsWith("same state")
          ? {
              level: "medium-low",
              detail: "Matched at state level only — local variation inside the state is not captured.",
            }
          : { level: "low", detail: "No geographic match." };
  const lv = Object.values(local.levels ?? {}).filter(Boolean);
  const avgLevel = lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : null;
  const reliability =
    avgLevel == null
      ? { level: "unknown" }
      : {
          level: avgLevel <= 2 ? "high" : avgLevel <= 3.5 ? "medium-high" : avgLevel <= 4.5 ? "medium" : "low",
          averageSourceLevel: round(avgLevel, 1),
        };

  return {
    score: score == null ? null : round(score, 1),
    coverage: wTotal ? round((wUsed / wTotal) * 100, 1) : 0,
    rows,
    matched: rows.filter((r) => r.status === "match").map((r) => r.key),
    partial: rows.filter((r) => r.status === "partial").map((r) => r.key),
    mismatched: rows.filter((r) => r.status === "mismatch").map((r) => r.key),
    missing: rows.filter((r) => r.status === "missing").map((r) => r.key),
    notComparable: rows.filter((r) => r.status === "not comparable").map((r) => r.key),
    outdated: age != null && age > 6 ? ["year"] : [],
    confidence: { geographic, temporal, reliability },
    formula: "Σ(weight × similarity) ÷ Σ(weights of comparable parameters) × 100",
    disclaimer:
      "Data compatibility between your dataset and local data — not the accuracy of any crop or yield prediction.",
  };
}

// ------------------------------------------------------------------ data quality
const RANGES = {
  ph: [3, 10.5],
  N: [0, 1500],
  P: [0, 400],
  K: [0, 1500],
  oc: [0, 15],
  rainfall: [0, 12000],
  temperature: [-10, 50],
  humidity: [0, 100],
  area: [0, 1e9],
  production: [0, 1e12],
  yield: [0, 1e5],
  year: [1900, 2100],
  lat: [6, 38],
  lon: [67, 98],
};

/** Data-quality report for canonical rows. */
export function validateDataset(
  rows,
  { now = new Date(), keyFields = ["state", "district", "crop", "season", "year"] } = {},
) {
  const n = rows.length;
  if (!n) return { rows: 0, score: null, issues: ["Dataset is empty."] };
  const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];

  const completeness = Object.fromEntries(
    fields.map((f) => [f, rows.filter((r) => r[f] != null && r[f] !== "").length / n]),
  );
  const avgCompleteness = Object.values(completeness).reduce((a, b) => a + b, 0) / (fields.length || 1);

  const seen = new Map();
  let duplicates = 0;
  for (const r of rows) {
    const k = JSON.stringify(fields.map((f) => r[f]));
    if (seen.has(k)) duplicates++;
    else seen.set(k, true);
  }

  const keys = keyFields.filter((f) => fields.includes(f));
  const groups = new Map();
  for (const r of rows) {
    if (!keys.length) break;
    const k = keys.map((f) => (f === "season" ? normSeason(r[f]) : r[f])).join("|");
    (groups.get(k) ?? groups.set(k, []).get(k)).push(r);
  }
  let conflicts = 0;
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const prods = new Set(g.map((r) => r.production ?? r.yield ?? null).filter((v) => v != null));
    if (prods.size > 1) conflicts += g.length;
  }

  let invalid = 0;
  let checked = 0;
  const invalidByField = {};
  for (const [f, [lo, hi]] of Object.entries(RANGES)) {
    if (!fields.includes(f)) continue;
    for (const r of rows) {
      if (r[f] == null) continue;
      checked++;
      if (r[f] < lo || r[f] > hi) {
        invalid++;
        invalidByField[f] = (invalidByField[f] ?? 0) + 1;
      }
    }
  }

  const outliersByField = {};
  let outliers = 0;
  let numericCells = 0;
  for (const f of ["ph", "N", "P", "K", "oc", "rainfall", "temperature", "humidity", "yield"]) {
    if (!fields.includes(f)) continue;
    const v = rows.map((r) => r[f]).filter((x) => x != null);
    if (v.length < 10) continue;
    const s = [...v].sort((a, b) => a - b);
    const q1 = s[Math.floor(s.length * 0.25)];
    const q3 = s[Math.floor(s.length * 0.75)];
    const iqr = q3 - q1;
    const lo = q1 - 3 * iqr;
    const hi = q3 + 3 * iqr;
    const o = v.filter((x) => x < lo || x > hi).length;
    outliersByField[f] = o;
    outliers += o;
    numericCells += v.length;
  }

  let consistencyChecked = 0;
  let inconsistent = 0;
  for (const r of rows) {
    if (r.area > 0 && r.production != null && r.yield != null) {
      consistencyChecked++;
      const expected = r.production / r.area;
      if (Math.abs(expected - r.yield) > Math.max(0.05 * Math.abs(expected), 0.01)) inconsistent++;
    }
  }

  const years = rows.map((r) => r.year).filter(Boolean);
  const latestYear = years.length ? Math.max(...years) : null;
  const age = latestYear ? now.getFullYear() - latestYear : null;
  const timeliness = age == null ? null : age <= 2 ? 1 : age <= 6 ? 0.7 : age <= 10 ? 0.4 : 0.2;

  const parts = {
    completeness: avgCompleteness,
    uniqueness: 1 - duplicates / n,
    validity: checked ? 1 - invalid / checked : 1,
    outliers: numericCells ? 1 - outliers / numericCells : 1,
    consistency: consistencyChecked ? 1 - inconsistent / consistencyChecked : null,
    timeliness,
  };
  const weights = {
    completeness: 0.3,
    uniqueness: 0.15,
    validity: 0.2,
    outliers: 0.15,
    consistency: 0.1,
    timeliness: 0.1,
  };
  const usable = Object.entries(parts).filter(([, v]) => v != null);
  const wSum = usable.reduce((s, [k]) => s + weights[k], 0);
  const score = (usable.reduce((s, [k, v]) => s + weights[k] * v, 0) / wSum) * 100;

  const issues = [];
  for (const [f, c] of Object.entries(completeness))
    if (c < 0.95) issues.push(`${f}: ${round((1 - c) * 100, 1)}% missing`);
  if (duplicates) issues.push(`${duplicates} exact duplicate rows`);
  if (conflicts) issues.push(`${conflicts} rows share the same ${keys.join("/")} but report different values`);
  for (const [f, c] of Object.entries(invalidByField)) issues.push(`${f}: ${c} values outside plausible range`);
  for (const [f, c] of Object.entries(outliersByField))
    if (c) issues.push(`${f}: ${c} extreme outliers (beyond 3×IQR)`);
  if (inconsistent) issues.push(`${inconsistent} rows where production ÷ area differs from yield by >5%`);
  if (age != null && age > 6) issues.push(`Latest record is ${latestYear} (${age} years old)`);

  return {
    rows: n,
    fields: fields.length,
    score: round(score, 1),
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v == null ? null : round(v * 100, 1)])),
    completeness: Object.fromEntries(Object.entries(completeness).map(([k, v]) => [k, round(v * 100, 1)])),
    duplicates,
    conflicts,
    invalid,
    outliers,
    inconsistent,
    latestYear,
    issues,
  };
}
