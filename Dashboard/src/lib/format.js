// Number & text formatting shared by tiles, axes, tooltips and tables.
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 1,284 under 10,000; 12.9K / 4.2M above (stat tiles and axes). */
export function fmtNumber(value, { decimals = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (Math.abs(n) >= 10_000) return compact.format(n);
  return decimals ? n.toFixed(decimals) : full.format(n);
}

export function fmtPct(value, decimals = 1) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${(Number(value) * 100).toFixed(decimals)}%`;
}

export function fmtMs(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return "—";
  const n = Number(ms);
  if (n >= 1000) return `${(n / 1000).toFixed(2)} s`;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ms`;
}

export function fmtDuration(seconds) {
  if (seconds == null) return "—";
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function titleCase(text = "") {
  return String(text).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Signed probability-point change, e.g. +12.4 pts. */
export function fmtPoints(delta) {
  const pts = Number(delta) * 100;
  return `${pts >= 0 ? "+" : "−"}${Math.abs(pts).toFixed(1)} pts`;
}

export const FEATURE_LABELS = {
  N: "Nitrogen (N)",
  P: "Phosphorus (P)",
  K: "Potassium (K)",
  temperature: "Temperature",
  humidity: "Humidity",
  ph: "Soil pH",
  rainfall: "Rainfall",
};

export const FEATURE_UNITS = { N: "kg/ha", P: "kg/ha", K: "kg/ha", temperature: "°C", humidity: "%", ph: "", rainfall: "mm" };
