// Crop photos, seasonal suitability scoring and crop-rotation planning.
// Data: src/data/generated/atlas.json, imported by scripts/import_streamlit_assets.py
// from the companion Streamlit project (same author). Scoring mirrors its
// src/advisory.py and src/rotation.py so both apps give the same answers.
import atlas from "@/data/generated/atlas.json";

export const ATLAS_CROPS = atlas.crops;
export const ATLAS_SOILS = atlas.soils;
export const ATLAS_STATES = atlas.states;
export const ROTATION_GUIDE = atlas.rotation;
export const CROP_GROUPS = [...new Set(atlas.crops.map((c) => c.group))].sort();
export const ADVISOR_SEASONS = ["Kharif", "Rabi", "Zaid"];
export const WATER_LEVELS = ["Low", "Medium", "High"];

const BY_NAME = new Map(atlas.crops.map((c) => [c.name.toLowerCase(), c]));
const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");
const BY_NORM = new Map(atlas.crops.map((c) => [norm(c.name), c]));

// Names used elsewhere in the app (India catalogue ids, yield-dataset names, ML ids) → atlas crop.
const ALIASES = {
  bajra: "Pearl Millet", jowar: "Sorghum", ragi: "Finger Millet", arhar: "Pigeon Pea", arhartur: "Pigeon Pea", pigeonpeas: "Pigeon Pea",
  moong: "Green Gram", moonggreengram: "Green Gram", mungbean: "Green Gram", urad: "Black Gram", blackgram: "Black Gram",
  masoor: "Lentil", gram: "Chickpea", peasbeans: "Peas", citrus: "Orange", greenchilli: "Chilli", drychilli: "Chilli",
  drychillies: "Chilli", blackpepper: "Black Pepper", cashewnut: "Cashew", cottonlint: "Cotton", rapeseedmustard: "Mustard",
  soyabean: "Soybean", sesamum: "Sesame", fingermillet: "Finger Millet", pearlmillet: "Pearl Millet",
};

/** Atlas profile (with photo) for any crop name or id used in the app, else undefined. */
export function atlasCrop(nameOrId) {
  if (!nameOrId) return undefined;
  const key = norm(nameOrId);
  return BY_NAME.get(nameOrId.toLowerCase()) ?? BY_NORM.get(key) ?? (ALIASES[key] && BY_NAME.get(ALIASES[key].toLowerCase()));
}

export const cropImage = (nameOrId) => atlasCrop(nameOrId)?.image;

/** Season for a month (1–12), same rule as the Streamlit advisor. */
export function advisorSeason(month = new Date().getMonth() + 1) {
  if ([6, 7, 8, 9, 10].includes(month)) return "Kharif";
  if ([11, 12, 1, 2, 3].includes(month)) return "Rabi";
  return "Zaid";
}

const WATER = { Low: 1, Medium: 2, High: 3 };

/**
 * Transparent 0–100 suitability score: state fit 18, season 30, soil 24,
 * water up to 14, temperature up to 9, rainfall up to 5.
 */
export function recommendSeasonalCrops({ state, season, soil, water, temperature, rainfall, topN = 10 }) {
  const sp = ATLAS_STATES[state];
  const temp = Number(temperature ?? sp?.temp ?? 25);
  const rain = Number(rainfall ?? sp?.rain ?? 1000);
  return atlas.crops
    .map((c) => {
      const stateMatch = Boolean(sp?.crops.includes(c.name));
      const seasonMatch = c.seasons.includes(season) || c.seasons.includes("Whole Year") || c.seasons.includes("Perennial");
      const soilMatch = c.soils.includes(soil);
      const waterGap = Math.abs(WATER[water] - WATER[c.water]);
      const tempGap = Math.abs(temp - c.temp);
      const rainRatio = Math.abs(rain - c.rain) / Math.max(c.rain, 1);
      const parts = {
        state: 18 * stateMatch, season: 30 * seasonMatch, soil: 24 * soilMatch,
        water: Math.max(0, 14 - 7 * waterGap), temperature: Math.max(0, 9 - 1.5 * tempGap), rainfall: Math.max(0, 5 - 5 * rainRatio),
      };
      const score = Math.min(100, Math.max(0, Object.values(parts).reduce((a, b) => a + b, 0)));
      const why = [];
      if (stateMatch) why.push("representative state crop");
      if (seasonMatch) why.push(`fits ${season}`);
      if (soilMatch) why.push(`suited to ${soil.toLowerCase()} soil`);
      if (waterGap === 0) why.push("water need matches");
      return { ...c, score: Math.round(score * 10) / 10, parts, why: why.length ? why : ["requires local validation"] };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, topN);
}

/**
 * Next-crop options after `previous`: exact rotation-guide matches first, then
 * lower-confidence general fallbacks (−18) so three options always come back.
 */
export function recommendRotation({ previous, season, soil, topN = 3 }) {
  let candidates = ROTATION_GUIDE.filter((r) => r.prev === previous).map((r) => ({ ...r, fallback: false }));
  if (new Set(candidates.map((c) => c.next)).size < topN) {
    const existing = new Set([...candidates.map((c) => c.next), previous]);
    candidates = candidates.concat(ROTATION_GUIDE.filter((r) => !existing.has(r.next))
      .map((r) => ({ ...r, prev: previous, score: r.score - 18, reason: `General fallback: ${r.reason.charAt(0).toLowerCase()}${r.reason.slice(1)}`, fallback: true })));
  }
  const seen = new Set();
  return candidates
    .map((c) => {
      const seasonMatch = c.season === season; const soilMatch = c.soil === soil;
      return { ...c, seasonMatch, soilMatch, total: Math.min(100, c.score + 6 * seasonMatch + 4 * soilMatch) };
    })
    .sort((a, b) => b.total - a.total || b.seasonMatch - a.seasonMatch || b.soilMatch - a.soilMatch)
    .filter((c) => (seen.has(c.next) ? false : seen.add(c.next)))
    .slice(0, topN);
}

export const ROTATION_PREVIOUS = [...new Set(ROTATION_GUIDE.map((r) => r.prev))].sort();
