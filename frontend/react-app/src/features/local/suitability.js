// Crop suitability: agronomic constraints first, ML second, every score explained.
// Pure functions; inputs are plain numbers/strings already gathered for a location.
import yieldModel from "@/data/generated/yieldModel.json";
import { CROPS } from "@/data/indiaAgri";
import { ATLAS_CROPS } from "@/lib/atlas";
import { recommendLocal } from "@/lib/agriModels";

import { round } from "./geo";
import { cropKey, SOIL_FAMILY } from "./matching";

// AgriSmart atlas crop -> crop_yield.csv crop name (state yield history).
export const YIELD_NAME = {
  Rice: "Rice",
  Wheat: "Wheat",
  Maize: "Maize",
  Barley: "Barley",
  Sugarcane: "Sugarcane",
  Tobacco: "Tobacco",
  Cotton: "Cotton(lint)",
  Jute: "Jute",
  Banana: "Banana",
  "Finger Millet": "Ragi",
  "Pearl Millet": "Bajra",
  Sorghum: "Jowar",
  Cashew: "Cashewnut",
  Groundnut: "Groundnut",
  Mustard: "Rapeseed &Mustard",
  Sesame: "Sesamum",
  Soybean: "Soyabean",
  Sunflower: "Sunflower",
  Arecanut: "Arecanut",
  Coconut: "Coconut",
  "Black Gram": "Urad",
  Chickpea: "Gram",
  "Green Gram": "Moong(Green Gram)",
  Lentil: "Masoor",
  "Pigeon Pea": "Arhar/Tur",
  "Black Pepper": "Black pepper",
  Cardamom: "Cardamom",
  Chilli: "Dry chillies",
  Ginger: "Ginger",
  Turmeric: "Turmeric",
  Tapioca: "Tapioca",
  Onion: "Onion",
  Potato: "Potato",
  Peas: "Peas & beans (Pulses)",
};

// AgriSmart atlas crop -> crop_data.csv label (ML model classes).
export const ML_NAME = {
  Rice: "rice",
  Maize: "maize",
  Chickpea: "chickpea",
  "Pigeon Pea": "pigeonpeas",
  "Green Gram": "mungbean",
  "Black Gram": "blackgram",
  Lentil: "lentil",
  Banana: "banana",
  Mango: "mango",
  Watermelon: "watermelon",
  Apple: "apple",
  Orange: "orange",
  Coconut: "coconut",
  Cotton: "cotton",
  Jute: "jute",
  Coffee: "coffee",
};

// Crops that need acidic soils (well-established agronomy); penalised above pH 7.
const ACID_LOVING = new Set(["Tea", "Coffee", "Rubber", "Cardamom", "Pineapple", "Black Pepper", "Arecanut", "Cashew"]);

const SEASON_MONTHS = { Kharif: [6, 7, 8, 9, 10], Rabi: [11, 12, 1, 2, 3], Zaid: [3, 4, 5] };
const SOWING = { Kharif: "June–July (with the monsoon)", Rabi: "October–December", Zaid: "March–April" };
const WATER_MM = { Low: "low (≈ 300–500 mm per season)", Medium: "medium (≈ 500–900 mm)", High: "high (> 900 mm or assured irrigation)" };

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Historical yield quartiles (t/ha) for state/crop/season from the dataset, or null. */
export function historicalYield(state, atlasName, season) {
  const crop = YIELD_NAME[atlasName];
  if (!crop || !state) return null;
  const st = state === "Jammu & Kashmir" ? "Jammu and Kashmir" : state;
  const dsSeason = season === "Zaid" ? "Summer" : season; // the dataset calls Zaid "Summer"
  const tryKeys = [dsSeason, "Whole Year"].filter(Boolean).map((s) => `${st}|${crop}|${s}`);
  for (const k of tryKeys) {
    const g = yieldModel.groups[k];
    if (g) return { crop, season: k.split("|")[2], n: g[2], p25: g[3], median: g[4], p75: g[5], level: "state" };
  }
  return null;
}

/**
 * Score crops for a location.
 * ctx = { state, season, monthlyNormals[{month,temp,rain}], annualRain, irrigation: bool,
 *         soilClasses[], texture, ph, npk: {N,P,K}|null, humidity, stateCrops[] (dataset names),
 *         conditions: [{id}] }
 */
export function scoreCrops(ctx) {
  const months = SEASON_MONTHS[ctx.season] ?? [];
  const seasonTemp = avg(ctx.monthlyNormals?.filter((m) => months.includes(m.month)).map((m) => m.temp));
  const seasonRain = sumOf(ctx.monthlyNormals?.filter((m) => months.includes(m.month)).map((m) => m.rain));
  const stateCropKeys = new Set((ctx.stateCrops ?? []).map(cropKey));

  let ml = null;
  if (ctx.npk && [ctx.npk.N, ctx.npk.P, ctx.npk.K].every((v) => v != null) && ctx.ph != null && seasonTemp != null) {
    const res = recommendLocal({ N: ctx.npk.N, P: ctx.npk.P, K: ctx.npk.K, temperature: seasonTemp, humidity: ctx.humidity ?? 70, ph: ctx.ph, rainfall: seasonRain ?? ctx.annualRain / 3 }, 22);
    const max = Math.max(...res.top.map((t) => t.confidence));
    ml = Object.fromEntries(res.top.map((t) => [t.crop, t.confidence / max]));
  }

  const results = ATLAS_CROPS.map((c) => {
    const perennial = c.seasons.some((s) => s === "Perennial" || s === "Whole Year");
    const inSeason = c.seasons.includes(ctx.season) || perennial;
    const parts = {};
    const reasons = [];
    const cautions = [];

    // Temperature: seasonal normal vs crop optimum.
    if (seasonTemp != null || perennial) {
      const t = perennial ? avg(ctx.monthlyNormals?.map((m) => m.temp)) : seasonTemp;
      const d = Math.abs(t - c.temp);
      parts.temperature = clamp01(1 - d / 8);
      (parts.temperature >= 0.7 ? reasons : cautions).push(`${perennial ? "Annual" : ctx.season} mean temperature ${round(t, 1)} °C vs ~${c.temp} °C optimum`);
    }
    // Water: rainfall vs need, relaxed when irrigation is available.
    if (ctx.annualRain != null) {
      const ratio = ctx.annualRain / c.rain;
      if (ctx.irrigation) {
        parts.water = ratio > 3 ? 0.7 : 1;
        reasons.push(`Irrigation available; local rain ${ctx.annualRain} mm/yr vs ~${c.rain} mm need`);
      } else {
        parts.water = ratio >= 1 ? (ratio > 2.5 ? 0.6 : 1) : clamp01(ratio);
        if (ratio < 0.8) cautions.push(`Rain-fed: local rain ${ctx.annualRain} mm/yr is below the ~${c.rain} mm the crop needs`);
        else if (ratio > 2.5) cautions.push(`Very wet location (${ctx.annualRain} mm/yr) — drainage needed`);
        else reasons.push(`Local rain ${ctx.annualRain} mm/yr meets the ~${c.rain} mm need`);
      }
    }
    // Soil class / texture.
    if (ctx.soilClasses?.length || ctx.texture) {
      const classes = (ctx.soilClasses ?? []).map((s) => s.toLowerCase());
      const direct = c.soils.some((s) => classes.some((x) => x.includes(s.toLowerCase()) || s.toLowerCase().includes(x)));
      const fam = c.soils.some((s) => (SOIL_FAMILY[s.toLowerCase()] ?? []).includes(ctx.texture));
      parts.soil = direct ? 1 : fam ? 0.7 : 0.4;
      if (direct || fam) reasons.push(`Grows on ${c.soils.join("/")} soils (${direct ? "regional class" : `texture ${ctx.texture}`} matches)`);
      else cautions.push(`Prefers ${c.soils.join("/")} soils`);
    }
    // pH.
    if (ctx.ph != null) {
      const mlProfile = ML_NAME[c.name];
      if (ACID_LOVING.has(c.name)) parts.ph = ctx.ph <= 6.5 ? 1 : ctx.ph <= 7 ? 0.5 : 0.1;
      else parts.ph = ctx.ph < 5 || ctx.ph > 8.5 ? 0.2 : ctx.ph < 5.5 || ctx.ph > 8 ? 0.6 : 1;
      (parts.ph >= 0.6 ? reasons : cautions).push(`Soil pH ${ctx.ph}${ACID_LOVING.has(c.name) ? " (acid-soil crop)" : ""}${mlProfile ? "" : ""}`);
    }
    // Local practice (state statistics).
    const yName = YIELD_NAME[c.name];
    const grownHere = yName && stateCropKeys.has(cropKey(yName));
    parts.local = grownHere ? 1 : 0.4;
    if (grownHere) reasons.push(`Grown in ${ctx.state} according to state crop statistics`);
    // ML (only with real soil-test NPK).
    if (ml && ML_NAME[c.name] && ml[ML_NAME[c.name]] != null) {
      parts.ml = ml[ML_NAME[c.name]];
      if (parts.ml >= 0.5) reasons.push("ML model (trained on N, P, K, pH and climate) ranks it highly for your soil test");
    }

    const W = { temperature: 0.2, water: 0.25, soil: 0.15, ph: 0.1, local: 0.15, ml: 0.15 };
    const used = Object.keys(parts);
    const wSum = used.reduce((s, k) => s + W[k], 0);
    const score = wSum ? (used.reduce((s, k) => s + W[k] * parts[k], 0) / wSum) * 100 : null;

    const meta = CROPS.find((x) => x.en === c.name);
    const hist = historicalYield(ctx.state, c.name, perennial && !c.seasons.includes(ctx.season) ? "Whole Year" : ctx.season);
    const risks = [];
    for (const f of ctx.conditions ?? []) {
      if (f.id === "heat" && c.temp < 26) risks.push("Current heat stress is harmful to this cool-season crop");
      if (f.id === "waterlogging" && c.water !== "High") risks.push("Heavy rain forecast — waterlogging risk");
      if ((f.id === "drought" || f.id === "water-stress") && c.water === "High" && !ctx.irrigation) risks.push("Rainfall deficit and high water need");
      if (f.id === "cold" && c.temp >= 25) risks.push("Cold/frost risk for a warm-season crop");
      if (f.id === "humid" && ["Potato", "Tomato", "Chilli", "Grapes", "Onion"].includes(c.name)) risks.push("Humid weather favours fungal disease");
    }

    return {
      crop: c.name,
      group: c.group,
      inSeason,
      score: score == null ? null : round(score, 0),
      parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, round(v * 100, 0)])),
      reasons,
      cautions,
      risks,
      sowing: perennial ? "Perennial — plant at the start of the monsoon or with irrigation" : SOWING[ctx.season],
      duration: meta?.duration ?? null,
      water: WATER_MM[c.water] ?? c.water,
      waterNeedMm: c.rain,
      soils: c.soils,
      yieldRange: hist,
      mlUsed: parts.ml != null,
      image: c.image,
    };
  });

  const ranked = results.filter((r) => r.inSeason && r.score != null).sort((a, b) => b.score - a.score);
  const avoid = [
    ...results.filter((r) => !r.inSeason).map((r) => ({ crop: r.crop, reason: `Not a ${ctx.season} crop (${ATLAS_CROPS.find((x) => x.name === r.crop).seasons.join(", ")})` })),
    ...ranked.filter((r) => r.score < 45).map((r) => ({ crop: r.crop, reason: r.cautions[0] ?? "Low overall suitability" })),
  ];
  return {
    season: ctx.season,
    seasonTemp: seasonTemp == null ? null : round(seasonTemp, 1),
    seasonRain: seasonRain == null ? null : round(seasonRain, 0),
    mlUsed: Boolean(ml),
    top: ranked.slice(0, 5),
    ranked,
    avoid,
    method:
      "Suitability = weighted mean of temperature fit (20%), water fit (25%), soil class (15%), pH (10%), local practice (15%) and the ML model (15%, only with soil-test N, P, K). Out-of-season crops are excluded. This is an agronomic screening score, not a prediction accuracy.",
  };
}

const avg = (a) => {
  const v = (a ?? []).filter((x) => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};
const sumOf = (a) => {
  const v = (a ?? []).filter((x) => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) : null;
};
