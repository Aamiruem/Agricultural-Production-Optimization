// Data provenance. Every value shown by the local-intelligence feature is a
// "sourced value": { value, unit, source, type, resolution, observedAt, retrievedAt, level }.
// `level` follows the source-quality hierarchy (1 = best).

export const SOURCE_LEVELS = {
  1: "Farm measurement / laboratory report",
  2: "Verified local government record",
  3: "Official district or block data",
  4: "Satellite-derived or gridded model data",
  5: "Regional estimate / reference table",
  6: "General fallback",
};

export const DATA_TYPES = ["measured", "observed", "forecast", "modelled", "estimated", "reference"];

export const SOURCES = {
  user: {
    name: "Your entry (Soil Health Card / lab test / field)",
    url: null,
    level: 1,
  },
  nominatim: {
    name: "OpenStreetMap Nominatim",
    url: "https://nominatim.openstreetmap.org/",
    level: 4,
    licence: "© OpenStreetMap contributors (ODbL)",
  },
  boundaries: {
    name: "India administrative boundaries (datta07/INDIAN-SHAPEFILES, ~2019)",
    url: "https://github.com/datta07/INDIAN-SHAPEFILES",
    level: 3,
    licence: "MIT",
  },
  openMeteoForecast: {
    name: "Open-Meteo Forecast API (ECMWF, GFS and national models)",
    url: "https://open-meteo.com/en/docs",
    level: 4,
    licence: "CC BY 4.0",
  },
  openMeteoArchive: {
    name: "Open-Meteo Historical Weather API (ERA5 / ERA5-Land reanalysis)",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
    level: 4,
    licence: "CC BY 4.0",
  },
  soilgrids: {
    name: "ISRIC SoilGrids 2.0 (machine-learning soil maps, 250 m)",
    url: "https://rest.isric.org/soilgrids/v2.0/docs",
    level: 4,
    licence: "CC BY 4.0",
  },
  atlas: {
    name: "AgriSmart state reference table (regional soils, crops, climate normals)",
    url: null,
    level: 5,
  },
  cropYieldDataset: {
    name: "AgriSmart crop_yield.csv (state-level crop statistics 1997–2020)",
    url: "https://github.com/Aamiruem/Agricultural-Production-Optimization/tree/main/AIML/datasets",
    level: 3,
  },
  cropReqDataset: {
    name: "AgriSmart crop_data.csv (crop requirement profiles, 22 crops)",
    url: "https://github.com/Aamiruem/Agricultural-Production-Optimization/tree/main/AIML/datasets",
    level: 5,
  },
  derived: {
    name: "Computed by AgriSmart from the sources shown",
    url: null,
    level: 5,
  },
  model: {
    name: "AgriSmart model",
    url: "/insights",
    level: 5,
  },
};

/** Build a sourced value. `extra` may override type, resolution, observedAt, confidence, note. */
export function sv(value, unit, sourceId, extra = {}) {
  const src = SOURCES[sourceId] ?? { name: sourceId, level: 6 };
  return {
    value,
    unit,
    source: sourceId,
    sourceName: src.name,
    sourceUrl: src.url ?? null,
    level: extra.level ?? src.level,
    type: extra.type ?? "estimated",
    resolution: extra.resolution ?? "unknown",
    observedAt: extra.observedAt ?? null,
    retrievedAt: extra.retrievedAt ?? new Date().toISOString(),
    confidence: extra.confidence ?? confidenceForLevel(extra.level ?? src.level),
    note: extra.note ?? null,
  };
}

/** A value that could not be obtained — never filled with a guess. */
export function missing(unit, reason, extra = {}) {
  return { ...sv(null, unit, extra.source ?? "derived", { ...extra, type: "unavailable" }), missing: true, reason };
}

export function confidenceForLevel(level) {
  if (level <= 1) return "high";
  if (level <= 3) return "medium-high";
  if (level === 4) return "medium";
  return "low";
}

export const isMissing = (v) =>
  !v || v.missing || v.value == null || (typeof v.value === "number" && Number.isNaN(v.value));
