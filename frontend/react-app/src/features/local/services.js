// Network layer for the local-intelligence feature.
//
// Every call first tries the AgriSmart FastAPI service (/api/...), which proxies the
// public APIs with caching, rate limiting and a proper User-Agent. When no backend is
// deployed (static hosting), it calls the same public APIs directly from the browser.
// Nothing is ever simulated: failures surface as errors or "unavailable" values.
import { api, isApiUnavailable } from "@/services/apiClient";

import { featureAt, haversineKm, round } from "./geo";
import { parseSoilgrids, SOILGRIDS_PROPS, SOILGRIDS_URL } from "./soil";
import { missing, sv } from "./sources";

let backend = null; // null = unknown, true/false after the first probe this session
let probe = null;

/** One health check decides whether the AgriSmart API is deployed (avoids parallel 404s). */
function ensureBackend() {
  if (backend !== null) return Promise.resolve(backend);
  probe ??= api
    .get("/health", { timeout: 8000 })
    .then((r) => (backend = typeof r.data === "object" && r.data !== null))
    .catch(() => (backend = false));
  return probe;
}

async function viaBackendOr(remote, direct) {
  await ensureBackend();
  if (backend !== false) {
    try {
      const data = await remote();
      if (typeof data === "string") throw Object.assign(new Error("API returned HTML"), { code: "API_HTML" });
      backend = true;
      return { ...data, via: "backend" };
    } catch (error) {
      if (!isApiUnavailable(error)) throw error;
      backend = false;
    }
  }
  const data = await direct();
  return { ...data, via: "browser" };
}

export const backendStatus = () => backend;

// ------------------------------------------------------------------ caching helpers
function cacheGet(key, maxAgeMs) {
  try {
    const raw = sessionStorage.getItem(`agri-local:${key}`);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < maxAgeMs ? v : null;
  } catch {
    return null;
  }
}
function cacheSet(key, v) {
  try {
    sessionStorage.setItem(`agri-local:${key}`, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* storage full or unavailable */
  }
}

async function getJson(url, { timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok)
      throw Object.assign(new Error(`${new URL(url).hostname} returned HTTP ${res.status}`), { status: res.status });
    return await res.json();
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`${new URL(url).hostname} did not respond in time`, { cause: e });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Nominatim usage policy: at most one request per second, no autocomplete.
let nominatimQueue = Promise.resolve();
function nominatim(path) {
  const run = nominatimQueue.then(async () => {
    const res = await getJson(`https://nominatim.openstreetmap.org/${path}`);
    await new Promise((r) => setTimeout(r, 1100));
    return res;
  });
  nominatimQueue = run.catch(() => {});
  return run;
}

// ------------------------------------------------------------------ boundaries (static files)
const geoCache = new Map();
export async function loadGeo(path) {
  if (!geoCache.has(path)) geoCache.set(path, getJson(`/geo/${path}`, { timeout: 30000 }));
  return geoCache.get(path);
}

/** State / district / sub-district containing a point, from the bundled boundary files. */
export async function adminLookup([lat, lon]) {
  const states = await loadGeo("india-states.json");
  const state = featureAt([lat, lon], states);
  if (!state) return { state: null, district: null, subdistrict: null };
  const slug = state.properties.slug;
  const [districts, subs] = await Promise.all([
    loadGeo(`districts/${slug}.json`),
    loadGeo(`subdistricts/${slug}.json`),
  ]);
  const district = featureAt([lat, lon], districts);
  const sub = featureAt([lat, lon], subs);
  return {
    state: state.properties.name,
    stateSlug: slug,
    district: district?.properties.name ?? null,
    districtLgd: district?.properties.lgd ?? null,
    subdistrict: sub?.properties.name ?? null,
    subdistrictLgd: sub?.properties.lgd ?? null,
  };
}

// ------------------------------------------------------------------ location
const PLACE_KEYS = [
  "hamlet",
  "village",
  "suburb",
  "neighbourhood",
  "quarter",
  "town",
  "city_district",
  "city",
  "municipality",
];

function normalizeNominatim(r) {
  const a = r.address ?? {};
  const place = PLACE_KEYS.map((k) => a[k]).find(Boolean) ?? null;
  return {
    name: r.name || place || r.display_name?.split(",")[0],
    displayName: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    type: r.addresstype || r.type,
    locality: a.neighbourhood || a.suburb || a.quarter || null,
    village: a.village || a.hamlet || null,
    town: a.town || a.city || a.municipality || null,
    tehsil: a.county || a.subdistrict || null,
    district: a.state_district || a.district || null,
    state: a.state || null,
    postcode: a.postcode || null,
    bbox: r.boundingbox?.map(Number) ?? null,
  };
}

/** Search villages, towns, colonies and localities in India (submit-only, not autocomplete). */
export async function searchPlaces(query) {
  const q = query.trim();
  if (q.length < 3) return { results: [] };
  return viaBackendOr(
    async () => (await api.get("/location/search", { params: { q } })).data,
    async () => {
      const key = `search:${q.toLowerCase()}`;
      const hit = cacheGet(key, 24 * 3600e3);
      if (hit) return hit;
      const json = await nominatim(
        `search?format=jsonv2&addressdetails=1&countrycodes=in&limit=8&accept-language=en&q=${encodeURIComponent(q)}`,
      );
      const out = { results: json.map(normalizeNominatim), source: "nominatim", retrievedAt: new Date().toISOString() };
      cacheSet(key, out);
      return out;
    },
  );
}

/** Reverse geocode a point: OSM place names + official-style boundary lookup. */
export async function reverseGeocode([lat, lon]) {
  const [osm, admin] = await Promise.all([
    viaBackendOr(
      async () => (await api.get("/location/reverse-geocode", { params: { lat, lon } })).data,
      async () => {
        const key = `rev:${lat.toFixed(4)},${lon.toFixed(4)}`;
        const hit = cacheGet(key, 24 * 3600e3);
        if (hit) return hit;
        const json = await nominatim(
          `reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lon}`,
        );
        const out = json?.error
          ? { place: null, error: json.error }
          : { place: normalizeNominatim(json), retrievedAt: new Date().toISOString() };
        cacheSet(key, out);
        return out;
      },
    ).catch((e) => ({ place: null, error: e.message })),
    adminLookup([lat, lon]).catch(() => ({ state: null })),
  ]);
  const p = osm.place ?? {};
  const resolution = "point (reverse geocoded)";
  const named = (v, src, note) =>
    v
      ? sv(v, null, src, { type: "reference", resolution, note })
      : missing(null, "Not identified at this point", { source: src });
  return {
    lat: round(lat, 6),
    lon: round(lon, 6),
    inIndia: Boolean(admin.state),
    state: admin.state
      ? sv(admin.state, null, "boundaries", { type: "reference", resolution: "state boundary" })
      : named(p.state, "nominatim"),
    district: admin.district
      ? sv(admin.district, null, "boundaries", { type: "reference", resolution: "district boundary (~2019)" })
      : named(p.district, "nominatim"),
    subdistrict: admin.subdistrict
      ? sv(admin.subdistrict, null, "boundaries", {
          type: "reference",
          resolution: "sub-district (tehsil/taluka) boundary (~2019)",
        })
      : named(p.tehsil, "nominatim"),
    block: missing(
      null,
      "Block boundaries are not available in open, verifiable data; use the district/tehsil and point location.",
      { source: "boundaries" },
    ),
    village: named(
      p.village || p.town,
      "nominatim",
      "Nearest named place in OpenStreetMap — not an official village boundary",
    ),
    locality: named(p.locality, "nominatim", "OpenStreetMap neighbourhood/suburb, if mapped"),
    displayName: p.displayName ?? null,
    adminSlug: admin.stateSlug ?? null,
    osmError: osm.error ?? null,
    via: osm.via,
  };
}

// ------------------------------------------------------------------ weather
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const CURRENT_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation",
  "rain",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "surface_pressure",
  "cloud_cover",
  "shortwave_radiation",
];
const DAILY_VARS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "et0_fao_evapotranspiration",
  "shortwave_radiation_sum",
];
const SOIL_MOISTURE = ["soil_moisture_0_to_1cm", "soil_moisture_3_to_9cm", "soil_moisture_9_to_27cm"];

/** Current conditions, 7-day forecast and modelled soil moisture. */
export async function fetchWeather([lat, lon]) {
  return viaBackendOr(
    async () => (await api.get("/weather/forecast", { params: { lat, lon } })).data,
    async () => {
      const key = `wx:${lat.toFixed(3)},${lon.toFixed(3)}`;
      const hit = cacheGet(key, 20 * 60e3);
      if (hit) return hit;
      const url = `${FORECAST}?latitude=${lat}&longitude=${lon}&current=${CURRENT_VARS}&daily=${DAILY_VARS}&hourly=${SOIL_MOISTURE}&forecast_days=7&timezone=Asia%2FKolkata`;
      const json = await getJson(url);
      const out = { ...json, source: "openMeteoForecast", retrievedAt: new Date().toISOString() };
      cacheSet(key, out);
      return out;
    },
  );
}

/** Ten complete years of daily history (ERA5) plus the current year to date. */
export async function fetchHistory([lat, lon], today = new Date()) {
  return viaBackendOr(
    async () => (await api.get("/weather/history", { params: { lat, lon } })).data,
    async () => {
      const key = `hist:${lat.toFixed(2)},${lon.toFixed(2)}`;
      const hit = cacheGet(key, 12 * 3600e3);
      if (hit) return hit;
      const end = new Date(today.getTime() - 6 * 864e5).toISOString().slice(0, 10); // ERA5 lags ~5 days
      const start = `${today.getFullYear() - 10}-01-01`;
      const url = `${ARCHIVE}?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum,temperature_2m_mean,relative_humidity_2m_mean&timezone=Asia%2FKolkata`;
      const json = await getJson(url, { timeout: 40000 });
      const out = {
        daily: json.daily,
        latitude: json.latitude,
        longitude: json.longitude,
        source: "openMeteoArchive",
        retrievedAt: new Date().toISOString(),
      };
      cacheSet(key, out);
      return out;
    },
  );
}

/** Live temperature, humidity and 30-day rain at many points in one request (map layers). */
export async function fetchPointsWeather(points) {
  const lat = points.map((p) => p.lat).join(",");
  const lon = points.map((p) => p.lon).join(",");
  const key = `pts:${lat}:${lon}`.slice(0, 200);
  const hit = cacheGet(key, 30 * 60e3);
  if (hit) return hit;
  const json = await getJson(
    `${FORECAST}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&past_days=30&forecast_days=1&timezone=Asia%2FKolkata`,
    { timeout: 30000 },
  );
  const list = Array.isArray(json) ? json : [json];
  const out = list.map((r, i) => ({
    ...points[i],
    temp: r.current?.temperature_2m ?? null,
    humidity: r.current?.relative_humidity_2m ?? null,
    rain30: r.daily?.precipitation_sum
      ? round(
          r.daily.precipitation_sum.slice(0, 30).reduce((s, v) => s + (v ?? 0), 0),
          0,
        )
      : null,
    time: r.current?.time ?? null,
  }));
  cacheSet(key, out);
  return out;
}

// ------------------------------------------------------------------ soil
const OFFSETS_KM = [
  [2, 0],
  [0, 2],
  [-2, 0],
  [0, -2],
];

/**
 * SoilGrids for the point; if the cell is masked (built-up, water), try up to four
 * cells ~2 km away (SoilGrids allows 5 calls/minute) and say how far the sample is.
 */
export async function fetchSoil([lat, lon]) {
  return viaBackendOr(
    async () => (await api.get("/soil/local", { params: { lat, lon } })).data,
    async () => {
      const key = `soil:${lat.toFixed(3)},${lon.toFixed(3)}`;
      const hit = cacheGet(key, 7 * 864e5);
      if (hit) return hit;
      const query = (la, lo) =>
        `${SOILGRIDS_URL}?lon=${lo.toFixed(5)}&lat=${la.toFixed(5)}&${SOILGRIDS_PROPS.map((p) => `property=${p}`).join("&")}&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean`;
      // SoilGrids is often slow (40–90 s observed): long timeout and one retry.
      const fetchSg = async (url) => {
        try {
          return await getJson(url, { timeout: 75000 });
        } catch (e) {
          if (e.status && e.status < 500 && e.status !== 429) throw e;
          return getJson(url, { timeout: 75000 });
        }
      };
      let json = await fetchSg(query(lat, lon));
      let sample = [lat, lon];
      const empty = (j) => !j?.properties?.layers?.some((l) => l.depths.some((d) => d.values.mean != null));
      for (const [dn, de] of OFFSETS_KM) {
        if (!empty(json)) break;
        const la = lat + dn / 111.32;
        const lo = lon + de / (111.32 * Math.cos((lat * Math.PI) / 180));
        json = await fetchSg(query(la, lo));
        sample = [la, lo];
      }
      const out = {
        json: empty(json) ? null : json,
        sample,
        source: "soilgrids",
        retrievedAt: new Date().toISOString(),
      };
      cacheSet(key, out);
      return out;
    },
  ).then((r) => {
    if (r.parsed) return r; // backend already parsed
    if (!r.json) return { masked: true, sample: r.sample, retrievedAt: r.retrievedAt, via: r.via };
    const offsetKm = haversineKm([lat, lon], r.sample);
    return {
      ...parseSoilgrids(r.json, { offsetKm: offsetKm > 0.05 ? offsetKm : 0 }),
      sample: r.sample,
      retrievedAt: r.retrievedAt,
      via: r.via,
    };
  });
}

// ------------------------------------------------------------------ market prices (backend only)
/** AGMARKNET daily mandi prices via data.gov.in — needs the backend's DATA_GOV_IN_API_KEY. */
export async function fetchMarketPrices({ state, district }) {
  try {
    const { data } = await api.get("/agriculture/market-prices", { params: { state, district } });
    if (typeof data === "string") throw Object.assign(new Error("no backend"), { code: "API_HTML" });
    return data;
  } catch (e) {
    if (isApiUnavailable(e))
      return {
        unavailable: true,
        reason:
          "Mandi prices need the AgriSmart API with a data.gov.in key (AGMARKNET). Not available on the static site.",
      };
    if (e.response?.status === 503)
      return { unavailable: true, reason: e.response.data?.detail ?? "Market price service not configured." };
    throw e;
  }
}

// ------------------------------------------------------------------ datasets (static CSV)
export async function fetchCsv(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path} (HTTP ${res.status})`);
  return res.text();
}
