// A short summary of the user's latest Local Intelligence analysis, kept in this browser
// so the private dashboard can show it. Only values the analysis actually returned are
// stored — anything that failed stays null and the dashboard says "not available".

const KEY = "agri-last-analysis";
const val = (v) => (v && typeof v === "object" && "value" in v ? v.value : (v ?? null));

/** Merge new facts into the stored summary (location data, crops, comparison). */
export function saveLastAnalysis(patch) {
  try {
    const prev = loadLastAnalysis() ?? {};
    localStorage.setItem(KEY, JSON.stringify({ ...prev, ...patch, savedAt: new Date().toISOString() }));
  } catch {
    /* storage unavailable — dashboard simply shows the empty state */
  }
}

export function loadLastAnalysis() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastAnalysis() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Summary of a gatherLocal() result. Resets crops/match because the location changed. */
export function summarizeLocal(data, point) {
  const L = data.location ?? {};
  const place = [val(L.village) ?? val(L.locality) ?? val(L.subdistrict), val(L.district), val(L.state)].filter(
    Boolean,
  );
  const c = data.weather?.current;
  return {
    point: point ? [Number(point[0].toFixed(5)), Number(point[1].toFixed(5))] : null,
    place: place.length ? place.join(", ") : null,
    state: val(L.state),
    analyzedAt: data.analyzedAt ?? null,
    temperature: typeof c?.temperature_2m === "number" ? c.temperature_2m : null,
    weatherTime: c?.time ?? null,
    annualRain: data.history?.annualMean ?? null,
    rainYears: data.history?.years?.length ?? null,
    soilTexture: data.soil && !data.soil.masked ? val(data.soil.texture) : null,
    soilNote: data.soil?.masked ? "SoilGrids has no data here" : data.soilError ? "Soil lookup failed" : null,
    crops: null,
    match: null,
  };
}
