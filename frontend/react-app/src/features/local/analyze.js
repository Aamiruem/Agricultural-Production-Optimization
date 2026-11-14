// Orchestration: gather everything known about a location, compare it with a dataset,
// score crops and predict yield. Each section fails independently and reports why.
import { filterDiseases } from "@/data/diseases";
import { STATE_BY_NAME } from "@/data/indiaAgri";
import { ATLAS_STATES } from "@/lib/atlas";
import { predictYield } from "@/services/mlService";

import { classifyConditions, cropSeason, imdSeason, summarizeHistory } from "./climate";
import { BUILTIN_DATASETS, canonicalRows, detectSchema, parseCsv, recordsFor, stateAgriculture } from "./dataset";
import { convertArea, round } from "./geo";
import { compareProfiles, datasetProfile, DEFAULT_WEIGHTS, validateDataset } from "./matching";
import { fetchCsv, fetchHistory, fetchMarketPrices, fetchSoil, fetchWeather, reverseGeocode } from "./services";
import { regionalSoils, soilIndicators, userSoilValues } from "./soil";
import { isMissing, missing, sv } from "./sources";
import { historicalYield, scoreCrops, YIELD_NAME } from "./suitability";

const settle = async (p) => {
  try {
    return { ok: true, data: await p };
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e) };
  }
};

// ------------------------------------------------------------------ datasets
const datasetCache = new Map();

/** Load a built-in dataset (real AIML CSV) with detected schema and canonical rows. */
export async function loadBuiltinDataset(id) {
  if (!datasetCache.has(id)) {
    const meta = BUILTIN_DATASETS[id];
    datasetCache.set(
      id,
      fetchCsv(meta.path).then((text) => buildDataset(text, meta)),
    );
  }
  return datasetCache.get(id);
}

/** Build a dataset object from CSV text (built-in or uploaded). */
export function buildDataset(
  text,
  meta = { id: "upload", label: "Your uploaded dataset", source: "user", resolution: "as detected", units: {} },
) {
  const { rows, headers, errors } = parseCsv(text);
  const schema = detectSchema(headers, rows);
  return {
    meta,
    headers,
    schema,
    rows: canonicalRows(rows, schema.mapping),
    rawCount: rows.length,
    parseErrors: errors,
  };
}

// ------------------------------------------------------------------ local data
/** Fetch and assemble local data for a point (and optional farm inputs). */
export async function gatherLocal({
  point,
  areaHa = null,
  areaNote = null,
  userSoil = {},
  irrigation = null,
  season = null,
  today = new Date(),
}) {
  const [loc, wx, hist, soil] = await Promise.all([
    settle(reverseGeocode(point)),
    settle(fetchWeather(point)),
    settle(fetchHistory(point, today)),
    settle(fetchSoil(point)),
  ]);
  const location = loc.ok ? loc.data : null;
  const state = location?.state?.value ?? null;

  const history = hist.ok && hist.data.daily ? summarizeHistory(hist.data.daily, today) : null;
  const weather = wx.ok ? wx.data : null;
  const conditions = weather ? classifyConditions(weather, history) : null;
  const month = today.getMonth() + 1;
  const cropSeasonNow = season ?? cropSeason(month).id;

  const user = userSoilValues(userSoil);
  const soilData = soil.ok ? soil.data : null;
  const regional = state ? regionalSoils(state) : missing(null, "State not identified.");

  // Agriculture: reference crop lists (state-level) + state statistics from the dataset.
  const atlasState = ATLAS_STATES[state] ?? null;
  const indiaState = STATE_BY_NAME[state] ?? null;
  const referenceCrops = [
    ...new Set([...(atlasState?.crops ?? []), ...(indiaState?.kharif ?? []), ...(indiaState?.rabi ?? [])].flat()),
  ]
    .map((c) => (Array.isArray(c) ? c[0] : c))
    .filter((c) => typeof c === "string");
  const yieldDs = await settle(loadBuiltinDataset("crop_yield"));
  let stats = null;
  if (yieldDs.ok && state) {
    const { inState } = recordsFor(yieldDs.data.rows, { state });
    stats = stateAgriculture(inState);
  }
  const pests = state ? filterDiseases({ state, season: cropSeasonNow }).slice(0, 8) : [];
  const market = state ? await settle(fetchMarketPrices({ state, district: location?.district?.value })) : null;

  return {
    point,
    analyzedAt: new Date().toISOString(),
    location,
    locationError: loc.ok ? null : loc.error,
    area:
      areaHa != null
        ? sv(round(areaHa, 4), "ha", "user", { type: "measured", resolution: "your field", note: areaNote })
        : missing("ha", "No farm area entered or drawn."),
    weather,
    weatherError: wx.ok ? null : wx.error,
    history,
    historyError: hist.ok ? null : hist.error,
    conditions,
    seasons: { imd: imdSeason(month), crop: cropSeasonNow },
    soil: soilData,
    soilError: soil.ok ? null : soil.error,
    soilUser: user,
    soilRegional: regional,
    soilIndicators: soilIndicators({
      ph: user.ph?.value ?? soilData?.ph?.value ?? null,
      ec: user.ec?.value ?? null,
      micro: { S: user.S?.value, Zn: user.Zn?.value, Fe: user.Fe?.value, B: user.B?.value },
    }),
    irrigation:
      irrigation == null
        ? missing(
            null,
            "Irrigation not specified — open data on farm-level irrigation is not available. Tell us in the farm form.",
          )
        : sv(irrigation ? "Available" : "Rain-fed", null, "user", { type: "measured", resolution: "your field" }),
    agriculture: {
      referenceCrops: referenceCrops.length
        ? sv(referenceCrops, null, "atlas", { type: "reference", resolution: "state" })
        : missing(null, "No reference crop list for this state."),
      stats: stats
        ? sv(stats, null, "cropYieldDataset", {
            type: "observed",
            resolution: "state",
            observedAt: `${stats.firstYear}–${stats.latestYear}`,
          })
        : missing(null, yieldDs.ok ? "No records for this state in the dataset." : yieldDs.error),
      zone: atlasState?.zone ?? null,
      pests,
      market: market?.ok ? market.data : { unavailable: true, reason: market?.error ?? "State not identified." },
      groundwater: missing(
        null,
        "Groundwater levels need CGWB / India-WRIS station data, which has no open API wired here.",
        { source: "derived" },
      ),
    },
  };
}

/** Local values in the shape used for matching, preferring better sources. */
export function localForMatching(local) {
  const L = local.location ?? {};
  const user = local.soilUser ?? {};
  const soil = local.soil ?? {};
  const levels = {};
  const pick = (key, userVal, otherVal) => {
    const v = !isMissing(userVal) ? userVal : !isMissing(otherVal) ? otherVal : null;
    if (v) levels[key] = v.level;
    return v?.value ?? null;
  };
  if (local.history) {
    levels.rainfall = 4;
    levels.temperature = 4;
    levels.humidity = 4;
  }
  const regional = isMissing(local.soilRegional) ? [] : local.soilRegional.value;
  if (regional.length) levels.soil_type = 5;
  return {
    lat: local.point[0],
    lon: local.point[1],
    state: L.state?.value ?? null,
    district: L.district?.value ?? null,
    soilClasses: regional,
    texture: soil.texture?.value ?? null,
    ph: pick("ph", user.ph, soil.ph),
    N: pick("N", user.N, null),
    P: pick("P", user.P, null),
    K: pick("K", user.K, null),
    nutrientBasis: user.N || user.P || user.K ? "available-kg-ha" : null,
    oc: pick("oc", user.oc, soil.organicCarbon),
    rainfall: local.history?.annualMean ?? null,
    temperature: local.history?.meanTemp ?? null,
    humidity: local.history?.meanHumidity ?? null,
    crops: isMissing(local.agriculture?.referenceCrops) ? [] : local.agriculture.referenceCrops.value,
    season: local.seasons?.crop ?? null,
    area: local.area?.value ?? null,
    levels,
  };
}

/** Compare a dataset with the gathered local data. */
export function compareDataset(
  dataset,
  local,
  { weights = DEFAULT_WEIGHTS, cropFilter = null, now = new Date() } = {},
) {
  const lm = localForMatching(local);
  const { schema } = dataset;
  if (!schema.hasLocation) {
    return {
      dataset: dataset.meta,
      schema,
      noLocation: true,
      message:
        "This dataset has no location columns (state, district, village or latitude/longitude), so it cannot be matched to a place. It is used as crop requirement profiles in the suitability engine instead.",
    };
  }
  let records;
  let level;
  if (schema.hasCoordinates) {
    const near = dataset.rows
      .filter((r) => r.lat != null && r.lon != null)
      .map((r) => ({
        r,
        d: Math.hypot(r.lat - lm.lat, (r.lon - lm.lon) * Math.cos((lm.lat * Math.PI) / 180)) * 111.32,
      }));
    records = near.filter((x) => x.d <= 50).map((x) => x.r);
    level = "coordinates (within 50 km)";
  }
  if (!records?.length) {
    const found = recordsFor(dataset.rows, { state: lm.state, district: lm.district });
    records = found.level === "district" ? found.inDistrict : found.inState;
    level = found.level;
  }
  if (cropFilter) records = records.filter((r) => String(r.crop ?? "").toLowerCase() === cropFilter.toLowerCase());
  const profile = datasetProfile(records, { level });
  const comparison = compareProfiles(profile, lm, { weights, now, units: dataset.meta.units ?? {} });
  return {
    dataset: dataset.meta,
    schema,
    matchedRecords: records.length,
    matchLevel: level ?? "none",
    profile,
    comparison,
  };
}

export function datasetQuality(dataset) {
  return validateDataset(dataset.rows);
}

// ------------------------------------------------------------------ crops & yield
export function cropSuitability(local, { season, irrigation }) {
  const lm = localForMatching(local);
  const stats = isMissing(local.agriculture?.stats) ? null : local.agriculture.stats.value;
  return scoreCrops({
    state: lm.state,
    season: season ?? local.seasons.crop,
    monthlyNormals: local.history?.monthly ?? [],
    annualRain: local.history?.annualMean ?? null,
    irrigation: Boolean(irrigation),
    soilClasses: lm.soilClasses,
    texture: lm.texture,
    ph: lm.ph,
    npk: lm.nutrientBasis ? { N: lm.N, P: lm.P, K: lm.K } : null,
    humidity: lm.humidity,
    stateCrops: stats?.crops?.map((c) => c.crop) ?? [],
    conditions: local.conditions?.flags ?? [],
  });
}

/**
 * Yield and production for one crop on the selected area. Uses the served XGBoost model
 * when the API is up, otherwise the bundled browser model. Flags thin local data.
 */
export async function predictCropYield(local, { crop, season, areaHa, year = new Date().getFullYear() }) {
  const state = local.location?.state?.value;
  if (!state) throw new Error("Location state is not identified; yield models are state-level.");
  const yName = YIELD_NAME[crop] ?? crop;
  const dsState = state === "Jammu & Kashmir" ? "Jammu and Kashmir" : state;
  const dsSeason = season === "Zaid" ? "Summer" : season;
  const hist = historicalYield(state, crop, season);
  const res = await predictYield({
    crop: yName,
    season: dsSeason,
    state: dsState,
    year,
    area_ha: areaHa,
    annual_rainfall: local.history?.annualMean ?? undefined,
  });
  const yieldTHa = res.yield_t_ha;
  const thin = !hist || hist.n < 5;
  const low = res.low_t_ha ?? res.history?.p25 ?? null;
  const high = res.high_t_ha ?? res.history?.p75 ?? null;
  return {
    crop,
    datasetCrop: yName,
    season,
    state,
    areaHa,
    model: res.model ?? "AgriSmart yield model",
    engine: res.engine ?? "api",
    yieldTHa: round(yieldTHa, 3),
    rangeTHa: low != null && high != null ? [round(low, 3), round(high, 3)] : null,
    productionT: round(yieldTHa * areaHa, 3),
    productionRangeT: low != null && high != null ? [round(low * areaHa, 3), round(high * areaHa, 3)] : null,
    history: hist,
    rainfallUsed: local.history?.annualMean ?? null,
    insufficientLocalData: thin,
    resolution: "state-level model (no district or farm-level training data)",
    note: thin
      ? `Only ${hist?.n ?? 0} historical ${crop} records for ${state}/${season} — treat this as a baseline, not a precise local forecast.`
      : `Based on ${hist.n} historical state-level records. Farm management, variety and pests can move actual yield well outside this range.`,
    formula: `Production (t) = yield (t/ha) × area (ha) = ${round(yieldTHa, 3)} × ${round(areaHa, 4)}`,
  };
}

export { convertArea };
