// Instant-dashboard engine: parse an uploaded table, profile its columns, detect
// agricultural roles (crop, state, season, year, area, production, yield, rainfall,
// N-P-K, ...), and compute aggregates, correlations, outliers and plain-language insights.
// Everything runs in the browser; no data leaves the device.
import Papa from "papaparse";

export const MAX_ROWS = 200_000;
const NULLS = new Set(["", "na", "n/a", "nan", "null", "none", "-", "--", "?", "nil"]);

// ---------------------------------------------------------------- parsing

/** Parse CSV/TSV/TXT, Excel (.xlsx) or JSON into { columns, rows } with string cells. */
export async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) {
    const { default: readXlsxFile } = await import("read-excel-file");
    const sheet = await readXlsxFile(file);
    return fromMatrix(sheet.map((r) => r.map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ?? ""))));
  }
  if (name.endsWith(".xls")) throw new Error("Old .xls files are not supported. Save as .xlsx or CSV and try again.");
  const text = await file.text();
  if (name.endsWith(".json")) return fromJson(text);
  return parseText(text);
}

export function parseText(text) {
  const res = Papa.parse(text.replace(/^\uFEFF/, ""), { header: false, skipEmptyLines: "greedy", delimitersToGuess: [",", "\t", ";", "|"] });
  if (!res.data.length) throw new Error("The file is empty.");
  return fromMatrix(res.data);
}

function fromJson(text) {
  let data = JSON.parse(text);
  if (!Array.isArray(data)) data = Array.isArray(data?.data) ? data.data : Object.values(data).find(Array.isArray);
  if (!Array.isArray(data) || !data.length || typeof data[0] !== "object") throw new Error("JSON must be an array of records.");
  const cols = [...new Set(data.slice(0, 1000).flatMap((r) => Object.keys(r)))];
  return fromMatrix([cols, ...data.map((r) => cols.map((c) => r[c]))]);
}

function fromMatrix(matrix) {
  const [head, ...body] = matrix;
  if (!head || head.length < 1) throw new Error("No header row found.");
  const seen = {};
  const columns = head.map((h, i) => {
    let name = String(h ?? "").trim() || `Column ${i + 1}`;
    if (seen[name]) name = `${name} (${++seen[name]})`; else seen[name] = 1;
    return name;
  });
  if (!body.length) throw new Error("The file has a header but no data rows.");
  const rows = body.slice(0, MAX_ROWS).map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] == null ? "" : String(r[i]).trim()])));
  return { columns, rows, truncated: body.length > MAX_ROWS, totalRows: body.length };
}

// ---------------------------------------------------------------- profiling

/** Number from Indian/European-style strings: "1,23,456.7", "45%", "₹1,200". */
export function toNumber(v) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (NULLS.has(s.toLowerCase())) return null;
  const cleaned = s.replace(/[₹$€£,\s%]/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return null;
  return Number(cleaned);
}

const isNull = (v) => v == null || NULLS.has(String(v).trim().toLowerCase());
const DATE_RE = /^\d{4}-\d{1,2}-\d{1,2}([ T].*)?$|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;

function toDate(v) {
  const s = String(v).trim();
  if (!DATE_RE.test(s)) return null;
  let d;
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) { const y = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]); d = new Date(Date.UTC(y, Number(dmy[2]) - 1, Number(dmy[1]))); } // Indian day-first
  else d = new Date(s.length <= 10 ? `${s}T00:00:00Z` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const key = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

// Role → [header test, required column type]
const ROLE_RULES = [
  ["yield", (k) => /yield/.test(k), "numeric"],
  ["production", (k) => /production|^prod$|output|tonnes|quantity/.test(k), "numeric"],
  ["area", (k) => /area|hectare|acre|^ha$|landsize/.test(k), "numeric"],
  ["rainfall", (k) => /rain|precip/.test(k), "numeric"],
  ["temperature", (k) => /temp/.test(k), "numeric"],
  ["humidity", (k) => /humid/.test(k), "numeric"],
  ["nitrogen", (k) => /^n$|nitrogen/.test(k), "numeric"],
  ["phosphorus", (k) => /^p$|phosph/.test(k), "numeric"],
  ["potassium", (k) => /^k$|potass/.test(k), "numeric"],
  ["ph", (k) => /^ph$|soilph/.test(k), "numeric"],
  ["fertilizer", (k) => /fertili/.test(k), "numeric"],
  ["pesticide", (k) => /pestic/.test(k), "numeric"],
  ["price", (k) => /price|modal|mandi|msp|rate/.test(k), "numeric"],
  ["revenue", (k) => /revenue|income|sales/.test(k), "numeric"],
  ["cost", (k) => /cost|expense/.test(k), "numeric"],
  ["profit", (k) => /profit|margin/.test(k), "numeric"],
  ["year", (k) => /year|^yr$|cropyear/.test(k), "year"],
  ["date", (k) => /date|day|time/.test(k), "date"],
  ["crop", (k) => /crop|commodity|^label$|^item$|variety/.test(k), "category"],
  ["state", (k) => /state|province/.test(k), "category"],
  ["district", (k) => /district|^dist$|tehsil|block|village/.test(k), "category"],
  ["season", (k) => /season/.test(k), "category"],
  ["soil", (k) => /soil/.test(k), "category"],
];

export const ROLE_LABELS = {
  crop: "Crop", state: "State", district: "District", season: "Season", soil: "Soil type", year: "Year", date: "Date",
  area: "Area", production: "Production", yield: "Yield", rainfall: "Rainfall", temperature: "Temperature", humidity: "Humidity",
  nitrogen: "Nitrogen (N)", phosphorus: "Phosphorus (P)", potassium: "Potassium (K)", ph: "Soil pH", fertilizer: "Fertilizer",
  pesticide: "Pesticide", price: "Price", revenue: "Revenue", cost: "Cost", profit: "Profit",
};

/** Column profiles: type, missing share, distinct values and summary stats. */
export function profileColumns(columns, rows) {
  const sample = rows.length > 5000 ? rows.filter((_, i) => i % Math.ceil(rows.length / 5000) === 0) : rows;
  return columns.map((name) => {
    const vals = sample.map((r) => r[name]);
    const present = vals.filter((v) => !isNull(v));
    const nums = present.map(toNumber).filter((n) => n !== null);
    const dates = present.slice(0, 500).map(toDate).filter(Boolean);
    const distinct = new Set(present).size;
    let type = "category";
    if (present.length && nums.length / present.length >= 0.95) {
      const ints = nums.every((n) => Number.isInteger(n));
      type = ints && nums.every((n) => n >= 1900 && n <= 2100) && (/year|yr/.test(key(name)) || distinct <= 60) ? "year" : "numeric";
    } else if (present.length && dates.length / Math.min(present.length, 500) >= 0.9) type = "date";
    if (type === "category" && distinct > Math.max(50, present.length * 0.9) && present.length > 50) type = "text"; // ids / free text
    const missing = 1 - present.length / Math.max(vals.length, 1);
    const stats = type === "numeric" ? summary(nums) : null;
    return { name, type, missing, distinct, stats };
  });
}

/** Map roles → column names (first matching column of the right type wins). */
export function detectRoles(profiles) {
  const roles = {};
  const used = new Set();
  for (const [role, test, type] of ROLE_RULES) {
    const col = profiles.find((p) => !used.has(p.name) && test(key(p.name)) && (p.type === type || (type === "numeric" && p.type === "year" && role !== "year") || (type === "date" && p.type === "date")));
    if (col) { roles[role] = col.name; used.add(col.name); }
  }
  // A lone year-typed column is the year even without "year" in its name.
  if (!roles.year) { const y = profiles.find((p) => p.type === "year" && !used.has(p.name)); if (y) roles.year = y.name; }
  if (!roles.date) { const d = profiles.find((p) => p.type === "date" && !used.has(p.name)); if (d) roles.date = d.name; }
  return roles;
}

// ---------------------------------------------------------------- dataset

/**
 * Typed records with a derived yield (production ÷ area) when missing.
 * Returns { records, numeric, categories, derived }.
 */
export function buildDataset(rows, profiles, roles) {
  const derived = [];
  const canDerive = !roles.yield && roles.production && roles.area;
  if (canDerive) derived.push("yield");
  const records = rows.map((r) => {
    const o = {};
    for (const p of profiles) {
      const v = r[p.name];
      if (p.type === "numeric" || p.type === "year") o[p.name] = toNumber(v);
      else if (p.type === "date") o[p.name] = isNull(v) ? null : toDate(v);
      else o[p.name] = isNull(v) ? null : String(v).trim();
    }
    if (canDerive) {
      const prod = o[roles.production]; const area = o[roles.area];
      o["Yield (derived)"] = prod != null && area ? prod / area : null;
    }
    return o;
  });
  const effectiveRoles = { ...roles, ...(canDerive ? { yield: "Yield (derived)" } : {}) };
  const numeric = [...profiles.filter((p) => p.type === "numeric").map((p) => p.name), ...(canDerive ? ["Yield (derived)"] : [])];
  const categories = profiles.filter((p) => p.type === "category").map((p) => p.name);
  return { records, numeric, categories, roles: effectiveRoles, derived };
}

export function applyFilters(records, filters, roles) {
  return records.filter((r) => {
    for (const [col, val] of Object.entries(filters.categories ?? {})) if (val && r[col] !== val) return false;
    if (roles.year && filters.yearRange) {
      const y = r[roles.year];
      if (y != null && (y < filters.yearRange[0] || y > filters.yearRange[1])) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------- statistics

export function summary(nums) {
  const v = nums.filter((n) => n != null && Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const q = (p) => { const i = (v.length - 1) * p; const lo = Math.floor(i); return v[lo] + (v[Math.ceil(i)] - v[lo]) * (i - lo); };
  const sum = v.reduce((a, b) => a + b, 0);
  const mean = sum / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(v.length - 1, 1));
  const [q1, q3] = [q(0.25), q(0.75)];
  const iqr = q3 - q1;
  const outliers = v.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr).length;
  return { n: v.length, sum, mean, sd, min: v[0], q1, median: q(0.5), q3, max: v.at(-1), outliers };
}

export function pearson(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => x != null && y != null && Number.isFinite(x) && Number.isFinite(y));
  const n = pairs.length;
  if (n < 5) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n; const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0; let sxx = 0; let syy = 0;
  for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

export function correlationMatrix(records, cols) {
  const series = Object.fromEntries(cols.map((c) => [c, records.map((r) => r[c])]));
  return cols.map((a) => cols.map((b) => (a === b ? 1 : pearson(series[a], series[b]))));
}

/**
 * Group by a column and aggregate a metric. Yield-like metrics are area-weighted
 * when area and production are present; additive metrics are summed; others averaged.
 */
export function groupBy(records, by, metric, roles, { mode } = {}) {
  const how = mode ?? metricMode(metric, roles);
  const acc = new Map();
  for (const r of records) {
    const k = by === "__month" ? monthKey(r[roles.date]) : r[by];
    if (k == null) continue;
    const a = acc.get(k) ?? { key: k, sum: 0, n: 0, prod: 0, area: 0, count: 0 };
    a.count += 1;
    const v = r[metric];
    if (v != null && Number.isFinite(v)) { a.sum += v; a.n += 1; }
    if (how === "weighted") { const p = r[roles.production]; const ar = r[roles.area]; if (p != null && ar) { a.prod += p; a.area += ar; } }
    acc.set(k, a);
  }
  const out = [...acc.values()].map((a) => ({
    key: a.key, count: a.count,
    value: how === "sum" ? a.sum : how === "count" ? a.count : how === "weighted" ? (a.area ? a.prod / a.area : a.n ? a.sum / a.n : null) : a.n ? a.sum / a.n : null,
  })).filter((d) => d.value != null);
  return { mode: how, data: out };
}

export function metricMode(metric, roles) {
  if (!metric) return "count";
  if (metric === roles.yield && roles.production && roles.area) return "weighted";
  if ([roles.production, roles.area, roles.revenue, roles.cost, roles.profit, roles.fertilizer, roles.pesticide].includes(metric)) return "sum";
  return "mean";
}

const monthKey = (d) => (d instanceof Date ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}` : null);

/** Ordered time series of a metric by year (or month when there is a date column). */
export function timeSeries(records, metric, roles) {
  if (roles.year) {
    const { data, mode } = groupBy(records, roles.year, metric, roles);
    return { mode, unit: "year", data: data.sort((a, b) => a.key - b.key) };
  }
  if (roles.date) {
    const { data, mode } = groupBy(records, "__month", metric, roles, { mode: metricMode(metric, roles) === "sum" ? "sum" : "mean" });
    return { mode, unit: "month", data: data.sort((a, b) => String(a.key).localeCompare(String(b.key))) };
  }
  return null;
}

/**
 * Trend of a time series, robust to noisy single periods:
 * monthly data is first rolled up to calendar years (sum for additive metrics,
 * mean otherwise); then a log-linear least-squares fit over all years gives the
 * average % change per year and an R² for how well a steady trend describes it.
 * With fewer than 3 years it reports the plain change over the period instead.
 */
export function trendOf(ts) {
  if (!ts?.data?.length) return null;
  let pts = ts.data.map((d) => ({ key: d.key, value: d.value, count: d.count ?? 1 }));
  let shortMonthly = false;
  if (ts.unit === "month") {
    const byYear = new Map();
    for (const d of pts) {
      const y = Number(String(d.key).slice(0, 4));
      const a = byYear.get(y) ?? { key: y, sum: 0, n: 0, months: 0 };
      a.sum += d.value; a.n += 1; a.months += 1;
      byYear.set(y, a);
    }
    const years = [...byYear.values()].sort((x, y) => x.key - y.key);
    const full = years.filter((y) => y.months >= 10); // ignore partial years
    const yearly = full.length >= 3 ? full : years;
    // Under 3 years of monthly data: keep the months and only report the change.
    if (yearly.length >= 3) pts = yearly.map((y) => ({ key: y.key, value: ts.mode === "sum" ? y.sum : y.sum / y.n, count: y.n }));
    else shortMonthly = true;
  }
  pts = pts.filter((d) => d.value > 0);
  if (pts.length < 2) return null;
  const first = pts[0]; const last = pts.at(-1);
  const peak = pts.reduce((x, y) => (y.value > x.value ? y : x));
  const counts = pts.map((d) => d.count);
  const uneven = ts.mode === "sum" && Math.max(...counts) / Math.max(Math.min(...counts), 1) > 1.5;
  if (pts.length < 3 || shortMonthly) {
    return { kind: "change", change: last.value / first.value - 1, first, last, peak, uneven, unit: ts.unit };
  }
  const xs = pts.map((d) => Number(d.key)); const ys = pts.map((d) => Math.log(d.value));
  const mx = xs.reduce((a2, b2) => a2 + b2, 0) / xs.length; const my = ys.reduce((a2, b2) => a2 + b2, 0) / ys.length;
  let sxy = 0; let sxx = 0; let syy = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; });
  const slope = sxx ? sxy / sxx : 0;
  const r2 = sxx && syy ? (sxy * sxy) / (sxx * syy) : 0;
  return { kind: "trend", pct: Math.exp(slope) - 1, r2, first, last, peak, uneven, unit: "year" };
}

/** @deprecated use trendOf — kept for callers expecting a single growth number. */
export function growthRate(ts) {
  const t = trendOf(ts);
  return t?.kind === "trend" ? t.pct : null;
}

// ---------------------------------------------------------------- insights

const fmt = (v) => (Math.abs(v) >= 1e5 ? Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v) : Math.abs(v) >= 100 ? Math.round(v).toLocaleString("en-IN") : Math.round(v * 100) / 100);

/** Plain-language findings, most useful first. Each: { kind, text }. */
export function generateInsights(ds, records, profiles, primary) {
  const { roles } = ds;
  const out = [];
  const label = (c) => c?.replace(/_/g, " ");
  if (!records.length) return [{ kind: "warn", text: "No rows match the current filters." }];

  const ts = primary && timeSeries(records, primary, roles);
  const tr = ts && ts.data.length >= 3 ? trendOf(ts) : null;
  if (tr) {
    const span = `${tr.first.key}–${tr.last.key}`;
    const peak = `peak ${fmt(tr.peak.value)} in ${tr.peak.key}`;
    if (tr.kind === "change") {
      out.push({ kind: tr.change >= 0 ? "up" : "down", text: `${label(primary)} ${tr.change >= 0 ? "rose" : "fell"} ${Math.abs(tr.change * 100).toFixed(0)}% over ${span} (${peak}). The period is too short for a yearly trend.` });
    } else if (tr.r2 < 0.25 || Math.abs(tr.pct) < 0.005) {
      out.push({ kind: "info", text: `${label(primary)} shows no steady trend over ${span} (it varies year to year; ${peak}).` });
    } else {
      out.push({ kind: tr.pct >= 0 ? "up" : "down", text: `${label(primary)} ${tr.pct >= 0 ? "rose" : "fell"} about ${Math.abs(tr.pct * 100).toFixed(1)}% per year over ${span} (trend fit R² ${tr.r2.toFixed(2)}; ${peak}).` });
    }
    if (tr.uneven) out.push({ kind: "warn", text: `The number of rows per ${ts.unit} varies a lot, so yearly totals partly reflect data coverage. Compare averages or filter to a single crop and state.` });
  }
  const topBy = (col, metric) => {
    const { data, mode } = groupBy(records, col, metric, roles);
    if (data.length < 2) return null;
    const sorted = data.sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, d) => s + d.value, 0);
    return { first: sorted[0], last: sorted.at(-1), share: mode === "sum" && total ? sorted[0].value / total : null, n: sorted.length, mode };
  };
  if (roles.crop && primary) {
    const t = topBy(roles.crop, primary);
    if (t) {
      out.push({ kind: "top", text: t.share
        ? `${t.first.key} leads ${label(primary).toLowerCase()} among ${t.n} crops with ${(t.share * 100).toFixed(0)}% of the total.`
        : `${t.first.key} has the highest average ${label(primary).toLowerCase()} among ${t.n} crops (${fmt(t.first.value)}); ${t.last.key} the lowest (${fmt(t.last.value)}).` });
      // One crop dwarfing all others usually means mixed units (e.g. coconut counted in nuts, not tonnes).
      if (t.share && t.share > 0.8 && t.n >= 5) out.push({ kind: "warn", text: `${t.first.key} is ${(t.share * 100).toFixed(0)}% of all ${label(primary).toLowerCase()}. Check that every crop uses the same unit — some datasets count crops like coconut in nuts or cotton in bales. Filter it out to compare the rest.` });
    }
  }
  if (roles.yield && roles.crop && roles.yield !== primary) {
    const t = topBy(roles.crop, roles.yield);
    if (t) out.push({ kind: "top", text: `Highest average yield: ${t.first.key} (${fmt(t.first.value)} per unit area); lowest: ${t.last.key} (${fmt(t.last.value)}).` });
  }
  if (roles.state && primary) {
    const t = topBy(roles.state, roles.yield ?? primary);
    if (t) out.push({ kind: "geo", text: `${t.first.key} has the highest ${label(roles.yield ?? primary).toLowerCase()} of ${t.n} states/regions (${fmt(t.first.value)}); ${t.last.key} is lowest (${fmt(t.last.value)}).` });
  }
  if (roles.season && primary) {
    const t = topBy(roles.season, primary);
    if (t?.share) out.push({ kind: "season", text: `${t.first.key} season accounts for ${(t.share * 100).toFixed(0)}% of ${label(primary).toLowerCase()}.` });
  }
  // Strongest driver of the target (yield if present, else primary).
  const target = roles.yield ?? primary;
  if (target) {
    const drivers = ds.numeric.filter((c) => c !== target && c !== roles.production && c !== roles.area)
      .map((c) => ({ c, r: pearson(records.map((x) => x[c]), records.map((x) => x[target])) }))
      .filter((d) => d.r !== null && Math.abs(d.r) >= 0.2).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    if (drivers[0]) {
      const d = drivers[0];
      const strength = Math.abs(d.r) >= 0.6 ? "strong" : Math.abs(d.r) >= 0.4 ? "moderate" : "weak";
      out.push({ kind: "corr", text: `${label(d.c)} has the strongest link with ${label(target).toLowerCase()}: a ${strength} ${d.r > 0 ? "positive" : "negative"} relationship (r = ${d.r.toFixed(2)}). Correlation is not causation.` });
    }
  }
  if (roles.nitrogen && roles.phosphorus && roles.potassium && roles.crop) {
    const n = topBy(roles.crop, roles.nitrogen); const k = topBy(roles.crop, roles.potassium);
    if (n && k) out.push({ kind: "soil", text: `${n.first.key} needs the most nitrogen (avg ${fmt(n.first.value)}); ${k.first.key} the most potassium (avg ${fmt(k.first.value)}).` });
  }
  if (roles.rainfall && !roles.year && roles.date) {
    const s = summary(records.map((r) => r[roles.rainfall]));
    const wet = records.filter((r) => (r[roles.rainfall] ?? 0) >= 2.5).length;
    if (s) out.push({ kind: "weather", text: `${wet.toLocaleString("en-IN")} of ${records.length.toLocaleString("en-IN")} days were rainy (≥ 2.5 mm); total rainfall ${fmt(s.sum)} mm.` });
  }
  const missingCols = profiles.filter((p) => p.missing > 0.05);
  if (missingCols.length) out.push({ kind: "warn", text: `${missingCols.length} column${missingCols.length > 1 ? "s have" : " has"} more than 5% missing values (${missingCols.slice(0, 3).map((p) => `${p.name} ${(p.missing * 100).toFixed(0)}%`).join(", ")}). Results use available values only.` });
  const outlierCols = profiles.filter((p) => p.stats?.outliers > p.stats?.n * 0.05);
  if (outlierCols.length) out.push({ kind: "warn", text: `Unusual values (outside 1.5× IQR) in ${outlierCols.slice(0, 3).map((p) => `${p.name} (${p.stats.outliers})`).join(", ")} — check units and data entry.` });
  if (ds.derived.includes("yield")) out.push({ kind: "info", text: `Yield was derived as ${roles.production} ÷ ${roles.area}; use the same units throughout for meaningful comparisons.` });
  return out;
}

/** Duplicate rows (exact matches on all columns). */
export function countDuplicates(rows, columns) {
  const seen = new Set(); let dup = 0;
  for (const r of rows) { const k = columns.map((c) => r[c]).join("\u0001"); if (seen.has(k)) dup += 1; else seen.add(k); }
  return dup;
}

/** Histogram bins for a numeric column (Freedman–Diaconis-ish, 8–24 bins). */
export function histogram(values, maxBins = 20) {
  const v = values.filter((x) => x != null && Number.isFinite(x));
  if (v.length < 2) return [];
  const s = summary(v);
  const lo = s.q1 - 1.5 * (s.q3 - s.q1) > s.min ? s.q1 - 1.5 * (s.q3 - s.q1) : s.min;
  const hi = s.q3 + 1.5 * (s.q3 - s.q1) < s.max ? s.q3 + 1.5 * (s.q3 - s.q1) : s.max;
  if (hi <= lo) return [{ bin: fmt(lo), count: v.length }];
  const bins = Math.min(maxBins, Math.max(8, Math.round(Math.sqrt(v.length))));
  const w = (hi - lo) / bins;
  const counts = Array.from({ length: bins }, (_, i) => ({ bin: fmt(lo + w * i), from: lo + w * i, count: 0 }));
  for (const x of v) counts[Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / w)))].count += 1;
  return counts;
}

export { fmt as formatValue };

const MODE_LABEL = { sum: "total", mean: "average", weighted: "area-weighted average", count: "count" };
export const modeLabel = (m) => MODE_LABEL[m] ?? m;
