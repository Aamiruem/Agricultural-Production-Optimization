// Geospatial helpers: geodesic area, distance, point-in-polygon and area units.
// Pure functions (no DOM), unit-tested in geo.test.js.

const R = 6378137; // WGS84 semi-major axis (m), the same radius turf.js uses for area
const rad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km between two [lat, lon] points. */
export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

/**
 * Geodesic area (m²) of a ring of [lat, lon] points on the WGS84 sphere
 * (spherical-excess formula, Chamberlain & Duquette 2007 — as used by turf.js).
 * Measured on the globe, not in screen pixels.
 */
export function ringAreaM2(latlngs) {
  const n = latlngs.length;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const [lat1, lon1] = latlngs[i];
    const [lat2, lon2] = latlngs[(i + 1) % n];
    total += rad(lon2 - lon1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return Math.abs((total * R * R) / 2);
}

/** Centroid (simple vertex mean, fine for field-sized polygons). */
export function ringCentroid(latlngs) {
  const n = latlngs.length || 1;
  return [latlngs.reduce((s, p) => s + p[0], 0) / n, latlngs.reduce((s, p) => s + p[1], 0) / n];
}

/** Ray-casting point-in-ring test with GeoJSON [lon, lat] ring coordinates. */
function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** True if [lat, lon] lies inside a GeoJSON Polygon or MultiPolygon geometry (holes respected). */
export function pointInGeometry([lat, lon], geometry) {
  if (!geometry) return false;
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  return polys.some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some((h) => inRing(lon, lat, h)));
}

/** First feature of a FeatureCollection containing the point, or null. */
export function featureAt(point, collection) {
  return collection?.features?.find((f) => pointInGeometry(point, f.geometry)) ?? null;
}

// ------------------------------------------------------------------ area units
// Bigha has no national standard: its size varies by state and even district.
// These are commonly cited values; the user must confirm the local measure.
export const AREA_UNITS = {
  ha: { label: "Hectare (ha)", m2: 10000 },
  acre: { label: "Acre", m2: 4046.8564224 },
  m2: { label: "Square metre (m²)", m2: 1 },
  "bigha-wb": { label: "Bigha – West Bengal / Assam (14,400 sq ft)", m2: 1337.8 },
  "bigha-up": { label: "Bigha – pucca, UP / Bihar / Rajasthan (27,225 sq ft)", m2: 2529.3 },
  "bigha-gj": { label: "Bigha – Gujarat / MP (17,424 sq ft)", m2: 1618.7 },
  "bigha-hp": { label: "Bigha – Himachal Pradesh (8,712 sq ft)", m2: 809.4 },
};

/** Convert `value` from one unit to another; returns {value, factor, explanation}. */
export function convertArea(value, from, to = "ha") {
  const a = AREA_UNITS[from];
  const b = AREA_UNITS[to];
  if (!a || !b) throw new Error(`Unknown area unit: ${!a ? from : to}`);
  const factor = a.m2 / b.m2;
  return {
    value: Number(value) * factor,
    factor,
    explanation: `1 ${a.label.split(" (")[0].split(" –")[0]}${from.startsWith("bigha") ? ` (${a.label.split("– ")[1]})` : ""} = ${round(factor, 6)} ${b.label.split(" (")[0]}`,
  };
}

export function round(v, d = 2) {
  if (v == null || Number.isNaN(v)) return v;
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
