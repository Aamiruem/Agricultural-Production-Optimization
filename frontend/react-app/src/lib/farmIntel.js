// Location-aware farm intelligence built from the India reference data.
import { CROP_PROFILES } from "@/data/cropProfiles";
import { CROPS, STATES, STATE_BY_NAME } from "@/data/indiaAgri";

/** Indian cropping season for a month (0 = January). */
export function currentSeason(month = new Date().getMonth()) {
  if (month >= 5 && month <= 8) return "kharif"; // Jun–Sep sowing
  if (month >= 2 && month <= 4) return "zaid"; // Mar–May
  return "rabi"; // Oct–Feb
}

// ML model crop ids → India catalogue ids.
const ML_TO_CATALOGUE = {
  rice: "rice", maize: "maize", chickpea: "chickpea", kidneybeans: "rajma", pigeonpeas: "arhar", mothbeans: "moth",
  mungbean: "moong", blackgram: "urad", lentil: "masoor", pomegranate: "pomegranate", banana: "banana", mango: "mango",
  grapes: "grapes", watermelon: "watermelon", muskmelon: "muskmelon", apple: "apple", orange: "citrus", papaya: "papaya",
  coconut: "coconut", cotton: "cotton", jute: "jute", coffee: "coffee",
};

// How ML crops appear in a state's own kharif/rabi lists ("Sali rice", "Bengal gram", "Tur"...).
const STATE_LIST_MATCH = {
  rice: (x) => /\b(rice|paddy)\b/.test(x),
  maize: (x) => /\bmaize\b/.test(x),
  chickpea: (x) => x === "gram" || /bengal gram|chana|chickpea/.test(x),
  kidneybeans: (x) => /rajma/.test(x),
  pigeonpeas: (x) => /arhar|\btur\b|red gram/.test(x),
  mothbeans: (x) => /\bmoth\b/.test(x),
  mungbean: (x) => /moong|green gram/.test(x),
  blackgram: (x) => /urad|black gram/.test(x),
  lentil: (x) => /lentil|masoor/.test(x),
  cotton: (x) => /cotton/.test(x),
  jute: (x) => /\bjute\b/.test(x),
};

/** "this" | "other" | null — whether the state's own list puts the crop in this season or the other one. */
function stateSeasonFit(ml, stateName, season) {
  const st = STATE_BY_NAME[stateName];
  const match = STATE_LIST_MATCH[ml];
  if (!st || !match || (season !== "kharif" && season !== "rabi")) return null;
  const inList = (list) => list.some((x) => match(x.toLowerCase()));
  const here = inList(season === "kharif" ? st.kharif : st.rabi);
  const there = inList(season === "kharif" ? st.rabi : st.kharif);
  return here ? "this" : there ? "other" : null;
}

/**
 * Crops the ML/fertilizer tools support, ranked for a state and season:
 * crops the state itself grows this season first, then in-season crops, then local perennials.
 */
export function recommendedFieldCrops(stateName, season = currentSeason()) {
  return Object.keys(CROP_PROFILES)
    .map((ml) => {
      const cat = CROPS.find((c) => c.id === ML_TO_CATALOGUE[ml]);
      const local = Boolean(stateName && cat?.states.includes(stateName));
      const inSeason = Boolean(cat?.seasons.includes(season) || CROP_PROFILES[ml].season === season);
      const perennial = CROP_PROFILES[ml].season === "perennial";
      // Bonus when this is the crop's main season (chickpea in rabi beats urad, a kharif pulse also sown in rabi).
      const primary = CROP_PROFILES[ml].season === season;
      // The state's own calendar wins: Punjab grows rice only in kharif, so no rice in Punjab's rabi.
      const fit = stateSeasonFit(ml, stateName, season);
      const stateBonus = fit === "this" ? 2 : fit === "other" ? -3 : 0;
      const score = (local ? 2 : 0) + (inSeason ? 2 : 0) + (primary ? 1 : 0) + (perennial && local ? 1 : 0) + stateBonus;
      return { crop: ml, label: cat?.en ?? ml, labelHi: cat?.hi ?? cat?.en ?? ml, emoji: cat?.emoji ?? "🌱", local, inSeason, score };
    })
    .filter((c) => c.score >= 3)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

/** All catalogue crops grown in the state this season (wider than the ML list). */
export function seasonalCropsFor(stateName, season = currentSeason()) {
  return CROPS.filter((c) => c.states.includes(stateName) && (c.seasons.includes(season) || c.seasons.includes("perennial")));
}

/** Nearest state/UT capital to a GPS point — a starting guess the user can change. */
export function nearestState(lat, lng) {
  let best = null;
  for (const s of STATES) {
    const d = (s.lat - lat) ** 2 + ((s.lon - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (!best || d < best.d) best = { name: s.name, d };
  }
  return best?.name;
}

/** Coordinates for weather: the farm's own GPS point, else its state capital. */
export function farmCoords(location) {
  const pt = location?.point?.coordinates;
  if (pt?.length === 2) return { lat: pt[1], lon: pt[0], label: location.village || location.district || "Farm location", precise: true };
  const s = STATE_BY_NAME[location?.state];
  return s ? { lat: s.lat, lon: s.lon, label: `${s.capital} (state capital)`, precise: false } : null;
}
