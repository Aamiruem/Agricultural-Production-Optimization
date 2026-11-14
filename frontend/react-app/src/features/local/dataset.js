// Dataset schema detection, loading and state-level agriculture facts. Pure functions
// except loadBuiltinDataset (fetch). Built-in datasets are the real AIML CSVs.
import Papa from "papaparse";

import { round } from "./geo";
import { mean } from "./climate";

// Canonical field -> header synonyms (lower-case, non-alphanumerics removed) + value check.
export const CANONICAL_FIELDS = {
  state: { synonyms: ["state", "statename", "stname", "province"], kind: "text" },
  district: { synonyms: ["district", "districtname", "dist", "dtname"], kind: "text" },
  subdistrict: { synonyms: ["tehsil", "taluka", "taluk", "subdistrict", "mandal", "block"], kind: "text" },
  village: { synonyms: ["village", "villagename", "locality", "colony", "town"], kind: "text" },
  lat: { synonyms: ["lat", "latitude", "y"], kind: "number", range: [6, 38] },
  lon: { synonyms: ["lon", "lng", "long", "longitude", "x"], kind: "number", range: [67, 98] },
  area: {
    synonyms: ["area", "areaha", "landarea", "farmarea", "cultivatedarea", "hectares"],
    kind: "number",
    range: [0, 1e9],
  },
  soil_type: { synonyms: ["soiltype", "soil", "soilclass"], kind: "text" },
  ph: { synonyms: ["ph", "soilph"], kind: "number", range: [2, 11] },
  N: { synonyms: ["n", "nitrogen", "availablen"], kind: "number", range: [0, 2000] },
  P: { synonyms: ["p", "phosphorus", "availablep"], kind: "number", range: [0, 500] },
  K: { synonyms: ["k", "potassium", "availablek"], kind: "number", range: [0, 2000] },
  oc: { synonyms: ["oc", "organiccarbon", "soc"], kind: "number", range: [0, 20] },
  rainfall: { synonyms: ["rainfall", "annualrainfall", "rain", "precipitation"], kind: "number", range: [0, 15000] },
  temperature: { synonyms: ["temperature", "temp", "meantemperature", "avgtemp"], kind: "number", range: [-20, 55] },
  humidity: { synonyms: ["humidity", "relativehumidity", "rh"], kind: "number", range: [0, 100] },
  season: { synonyms: ["season", "cropseason"], kind: "text" },
  crop: { synonyms: ["crop", "croptype", "cropname", "label", "commodity"], kind: "text" },
  irrigation: { synonyms: ["irrigation", "irrigated", "irrigationtype"], kind: "text" },
  production: { synonyms: ["production", "totalproduction", "output"], kind: "number", range: [0, 1e12] },
  yield: { synonyms: ["yield", "yieldtha", "productivity"], kind: "number", range: [0, 1e6] },
  year: { synonyms: ["year", "cropyear", "season_year"], kind: "number", range: [1900, 2100] },
  fertilizer: {
    synonyms: ["fertilizer", "fertiliser", "fertilizerusage", "fertilizerkg"],
    kind: "number",
    range: [0, 1e12],
  },
  pesticide: { synonyms: ["pesticide", "pesticideusage"], kind: "number", range: [0, 1e12] },
};

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Detect canonical fields from headers and sample rows.
 * Returns { mapping: {canonical: header}, fields: [{header, canonical, confidence, numericShare}], unmapped }.
 */
export function detectSchema(headers, rows = []) {
  const sample = rows.slice(0, 200);
  const used = new Set();
  const fields = headers.map((header) => {
    const h = norm(header);
    const values = sample.map((r) => r[header]).filter((v) => v !== "" && v != null);
    const nums = values.map(Number).filter((v) => !Number.isNaN(v));
    const numericShare = values.length ? nums.length / values.length : 0;
    let best = null;
    for (const [canonical, spec] of Object.entries(CANONICAL_FIELDS)) {
      const exact = spec.synonyms.includes(h);
      const partial = !exact && spec.synonyms.some((s) => s.length > 2 && (h.startsWith(s) || h.endsWith(s)));
      if (!exact && !partial) continue;
      let confidence = exact ? 0.9 : 0.6;
      if (spec.kind === "number") {
        if (numericShare < 0.9) continue;
        const inRange = spec.range
          ? nums.filter((v) => v >= spec.range[0] && v <= spec.range[1]).length / (nums.length || 1)
          : 1;
        confidence *= inRange >= 0.95 ? 1 : 0.5;
      } else if (numericShare > 0.9) {
        confidence *= 0.4;
      }
      if (!best || confidence > best.confidence) best = { canonical, confidence: round(confidence, 2) };
    }
    return {
      header,
      canonical: best?.canonical ?? null,
      confidence: best?.confidence ?? 0,
      numericShare: round(numericShare, 2),
    };
  });
  const mapping = {};
  for (const f of [...fields].sort((a, b) => b.confidence - a.confidence)) {
    if (f.canonical && !used.has(f.canonical)) {
      mapping[f.canonical] = f.header;
      used.add(f.canonical);
    } else if (f.canonical) {
      f.canonical = null; // duplicate candidate; keep the most confident
    }
  }
  return {
    mapping,
    fields,
    unmapped: fields.filter((f) => !f.canonical).map((f) => f.header),
    hasLocation: Boolean(mapping.state || mapping.district || mapping.village || (mapping.lat && mapping.lon)),
    hasCoordinates: Boolean(mapping.lat && mapping.lon),
  };
}

/** Parse CSV text into rows of strings (header row required). */
export function parseCsv(text) {
  const { data, meta, errors } = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return { rows: data, headers: meta.fields ?? [], errors: errors.slice(0, 5) };
}

/** Rows with canonical keys (numbers parsed, text trimmed). */
export function canonicalRows(rows, mapping) {
  return rows.map((r) => {
    const out = {};
    for (const [canonical, header] of Object.entries(mapping)) {
      const raw = r[header];
      const spec = CANONICAL_FIELDS[canonical];
      if (raw === "" || raw == null) out[canonical] = null;
      else if (spec.kind === "number") {
        const n = Number(String(raw).replace(/,/g, ""));
        out[canonical] = Number.isNaN(n) ? null : n;
      } else out[canonical] = String(raw).trim();
    }
    return out;
  });
}

export const BUILTIN_DATASETS = {
  crop_yield: {
    id: "crop_yield",
    label: "crop_yield.csv — state crop statistics 1997–2020",
    path: "/data/crop_yield.csv",
    source: "cropYieldDataset",
    resolution: "state",
    units: {
      area: "ha",
      production: "t (tonnes; bales/nuts for some crops)",
      yield: "t/ha",
      rainfall: "mm/year (Annual_Rainfall)",
      fertilizer: "kg",
      pesticide: "kg",
    },
  },
  crop_data: {
    id: "crop_data",
    label: "crop_data.csv — crop requirement profiles (no location)",
    path: "/data/crop_data.csv",
    source: "cropReqDataset",
    resolution: "none (crop profiles)",
    units: {
      N: "kg/ha (ratio in source)",
      P: "kg/ha",
      K: "kg/ha",
      temperature: "°C",
      humidity: "%",
      rainfall: "mm",
      ph: "pH",
    },
  },
};

// ------------------------------------------------------------------ name normalisation
const STATE_ALIASES = {
  "jammu and kashmir": "jammu & kashmir",
  "andaman and nicobar islands": "andaman & nicobar islands",
  "andaman and nicobar": "andaman & nicobar islands",
  "dadra and nagar haveli": "dadra & nagar haveli and daman & diu",
  "daman and diu": "dadra & nagar haveli and daman & diu",
  "nct of delhi": "delhi",
  orissa: "odisha",
  pondicherry: "puducherry",
  uttaranchal: "uttarakhand",
  chattisgarh: "chhattisgarh",
};
export function normPlace(name) {
  const s = String(name ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return STATE_ALIASES[s] ?? s.replace(/ and /g, " & ");
}
export const normSeason = (s) => {
  const v = String(s ?? "")
    .trim()
    .toLowerCase();
  if (!v) return null;
  // "Autumn" and "Winter" (Assam/Bengal rice seasons) are kept as their own labels.
  if (v.startsWith("kharif")) return "Kharif";
  if (v.startsWith("rabi")) return "Rabi";
  if (v === "autumn") return "Autumn";
  if (v === "winter") return "Winter";
  if (v.startsWith("zaid") || v.startsWith("summer")) return "Zaid";
  if (v.startsWith("whole")) return "Whole Year";
  return s.trim();
};

/** Records of a canonical dataset for one state (plus a district filter when present). */
export function recordsFor(rows, { state, district }) {
  const st = normPlace(state);
  const ds = district ? normPlace(district) : null;
  const inState = rows.filter((r) => r.state && normPlace(r.state) === st);
  const inDistrict = ds ? inState.filter((r) => r.district && normPlace(r.district) === ds) : [];
  return { inState, inDistrict, level: inDistrict.length ? "district" : inState.length ? "state" : null };
}

/** State-level agriculture facts from crop_yield rows (canonical). */
export function stateAgriculture(rows) {
  if (!rows.length) return null;
  const years = rows.map((r) => r.year).filter(Boolean);
  const latest = Math.max(...years);
  const recent = rows.filter((r) => r.year >= latest - 4);
  const byCrop = new Map();
  for (const r of recent) {
    const k = r.crop;
    const e = byCrop.get(k) ?? { crop: k, area: 0, production: 0, n: 0, yields: [], seasons: new Set() };
    e.area += r.area ?? 0;
    e.production += r.production ?? 0;
    e.n += 1;
    if (r.yield != null) e.yields.push(r.yield);
    if (r.season) e.seasons.add(normSeason(r.season));
    byCrop.set(k, e);
  }
  const yearsIn = new Set(recent.map((r) => r.year)).size || 1;
  const crops = [...byCrop.values()]
    .map((e) => ({
      crop: e.crop,
      avgAreaHa: Math.round(e.area / yearsIn),
      medianYield: round(median(e.yields), 2),
      seasons: [...e.seasons],
    }))
    .sort((a, b) => b.avgAreaHa - a.avgAreaHa);
  const rainByYear = new Map();
  for (const r of rows) if (r.year && r.rainfall != null) rainByYear.set(r.year, r.rainfall);
  const rainSeries = [...rainByYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, rain]) => ({ year, rain }));
  return {
    firstYear: Math.min(...years),
    latestYear: latest,
    records: rows.length,
    crops,
    seasons: [...new Set(rows.map((r) => normSeason(r.season)).filter(Boolean))],
    meanAnnualRainfall: round(mean(rainSeries.filter((x) => x.year >= latest - 4).map((x) => x.rain)), 0),
    rainSeries,
  };
}

export function median(a) {
  const v = a.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
