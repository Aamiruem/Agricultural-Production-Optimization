// Climate statistics and condition classification from weather data. Pure functions.
import { round } from "./geo";

// India Meteorological Department seasons.
export const IMD_SEASONS = [
  { id: "winter", label: "Winter", months: [1, 2] },
  { id: "pre-monsoon", label: "Summer / pre-monsoon", months: [3, 4, 5] },
  { id: "monsoon", label: "South-west monsoon", months: [6, 7, 8, 9] },
  { id: "post-monsoon", label: "Post-monsoon", months: [10, 11, 12] },
];

// Crop seasons used for planting decisions in India.
export const CROP_SEASONS = [
  { id: "Kharif", months: [6, 7, 8, 9, 10], sowing: "June–July", harvest: "September–October" },
  { id: "Rabi", months: [11, 12, 1, 2, 3], sowing: "October–December", harvest: "March–April" },
  { id: "Zaid", months: [3, 4, 5], sowing: "March–April", harvest: "June" },
];

export const imdSeason = (month) => IMD_SEASONS.find((s) => s.months.includes(month));
export const cropSeason = (month) => CROP_SEASONS.find((s) => s.months.includes(month)) ?? CROP_SEASONS[0];

/** IMD rainfall-departure categories (percent departure from normal). */
export function rainfallCategory(departurePct) {
  if (departurePct == null || Number.isNaN(departurePct)) return null;
  if (departurePct >= 60) return "Large excess";
  if (departurePct >= 20) return "Excess";
  if (departurePct > -20) return "Normal";
  if (departurePct > -60) return "Deficient";
  if (departurePct > -99) return "Large deficient";
  return "No rain";
}

/**
 * Summaries from daily history { time[], precipitation_sum[], temperature_2m_mean[], relative_humidity_2m_mean[] }.
 * Returns monthly normals, per-year annual and monsoon totals, a linear trend and the
 * current-year season-to-date departure.
 */
export function summarizeHistory(daily, today = new Date()) {
  const rows = daily.time.map((t, i) => ({
    y: Number(t.slice(0, 4)),
    m: Number(t.slice(5, 7)),
    d: Number(t.slice(8, 10)),
    p: daily.precipitation_sum?.[i],
    t: daily.temperature_2m_mean?.[i],
    h: daily.relative_humidity_2m_mean?.[i],
  }));
  const years = [...new Set(rows.map((r) => r.y))].sort();
  const fullYears = years.filter((y) => rows.filter((r) => r.y === y && r.p != null).length >= 360);

  const annual = fullYears.map((y) => ({ year: y, rain: round(sum(rows.filter((r) => r.y === y).map((r) => r.p)), 0) }));
  const monsoon = fullYears.map((y) => ({
    year: y,
    rain: round(sum(rows.filter((r) => r.y === y && r.m >= 6 && r.m <= 9).map((r) => r.p)), 0),
  }));
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const totals = fullYears.map((y) => sum(rows.filter((r) => r.y === y && r.m === m).map((r) => r.p)));
    const temps = rows.filter((r) => r.m === m && fullYears.includes(r.y)).map((r) => r.t);
    const hums = rows.filter((r) => r.m === m && fullYears.includes(r.y)).map((r) => r.h);
    return { month: m, rain: round(mean(totals), 1), temp: round(mean(temps), 1), humidity: round(mean(hums), 0) };
  });
  const seasonal = IMD_SEASONS.map((s) => ({
    ...s,
    rain: round(sum(monthly.filter((x) => s.months.includes(x.month)).map((x) => x.rain)), 0),
  }));
  const trend = linearTrend(annual.map((a) => [a.year, a.rain]));

  // Season-to-date departure for the current IMD season (history may lag a few days).
  const season = imdSeason(today.getMonth() + 1);
  const curYear = today.getFullYear();
  const lastObs = rows.filter((r) => r.p != null).at(-1);
  let departure = null;
  if (lastObs && lastObs.y === curYear && season.months.includes(lastObs.m)) {
    const inWindow = (r) => season.months.includes(r.m) && (r.m < lastObs.m || (r.m === lastObs.m && r.d <= lastObs.d));
    const actual = sum(rows.filter((r) => r.y === curYear && inWindow(r)).map((r) => r.p));
    const normal = mean(fullYears.filter((y) => y < curYear).map((y) => sum(rows.filter((r) => r.y === y && inWindow(r)).map((r) => r.p))));
    if (normal > 0) {
      const pct = ((actual - normal) / normal) * 100;
      departure = { season: season.label, actual: round(actual, 0), normal: round(normal, 0), pct: round(pct, 0), category: rainfallCategory(pct), upTo: `${lastObs.y}-${pad(lastObs.m)}-${pad(lastObs.d)}` };
    }
  }

  return {
    years: fullYears,
    annualMean: round(mean(annual.map((a) => a.rain)), 0),
    meanTemp: round(mean(rows.filter((r) => fullYears.includes(r.y)).map((r) => r.t)), 1),
    meanHumidity: round(mean(rows.filter((r) => fullYears.includes(r.y)).map((r) => r.h)), 0),
    annual,
    monsoon,
    monthly,
    seasonal,
    trendMmPerYear: trend ? round(trend.slope, 1) : null,
    departure,
    lastObservation: lastObs ? `${lastObs.y}-${pad(lastObs.m)}-${pad(lastObs.d)}` : null,
  };
}

/** Conditions flagged from current weather + 7-day forecast (+ optional history summary). */
export function classifyConditions({ current, daily }, history) {
  const flags = [];
  const tmax = Math.max(...(daily?.temperature_2m_max ?? []).filter((v) => v != null));
  const tmin = Math.min(...(daily?.temperature_2m_min ?? []).filter((v) => v != null));
  const rain7 = sum(daily?.precipitation_sum ?? []);
  const et07 = sum(daily?.et0_fao_evapotranspiration ?? []);
  const rh = current?.relative_humidity_2m;
  const maxDay = Math.max(...(daily?.precipitation_sum ?? [0]).filter((v) => v != null));

  if (tmax >= 40) flags.push({ id: "heat", label: "Heat stress", detail: `Forecast maximum ${tmax} °C (IMD heat-wave threshold for plains is 40 °C).`, severity: "high" });
  else if (tmax >= 35) flags.push({ id: "hot", label: "Hot conditions", detail: `Forecast maximum ${tmax} °C.`, severity: "medium" });
  if (tmin <= 4) flags.push({ id: "cold", label: "Cold / frost risk", detail: `Forecast minimum ${tmin} °C.`, severity: tmin <= 2 ? "high" : "medium" });
  if (rh != null && rh >= 75) flags.push({ id: "humid", label: "Humid", detail: `Relative humidity ${rh}% — favourable for fungal diseases.`, severity: "medium" });
  if (rh != null && rh <= 35) flags.push({ id: "dry", label: "Dry air", detail: `Relative humidity ${rh}%.`, severity: "low" });
  if (et07 > 0 && rain7 < et07 * 0.3 && et07 >= 20)
    flags.push({ id: "water-stress", label: "Water stress likely", detail: `7-day crop water demand (ET₀) ${round(et07, 0)} mm vs forecast rain ${round(rain7, 0)} mm.`, severity: "medium" });
  if (maxDay >= 64.5 || rain7 >= 150)
    flags.push({ id: "waterlogging", label: "Heavy rain / waterlogging risk", detail: `Up to ${round(maxDay, 0)} mm in a day (IMD heavy rain ≥ 64.5 mm/day); ${round(rain7, 0)} mm in 7 days.`, severity: "high" });
  if (history?.departure?.category && ["Deficient", "Large deficient", "No rain"].includes(history.departure.category))
    flags.push({ id: "drought", label: "Rainfall deficit", detail: `${history.departure.season} rain ${history.departure.pct}% vs normal (${history.departure.category}).`, severity: "high" });
  if (history?.departure?.category && ["Excess", "Large excess"].includes(history.departure.category))
    flags.push({ id: "excess", label: "Excess rainfall", detail: `${history.departure.season} rain +${history.departure.pct}% vs normal.`, severity: "medium" });
  return { flags, rain7: round(rain7, 1), et07: round(et07, 1), tmax, tmin };
}

function linearTrend(points) {
  if (points.length < 3) return null;
  const n = points.length;
  const mx = mean(points.map((p) => p[0]));
  const my = mean(points.map((p) => p[1]));
  const num = points.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const den = points.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  return den ? { slope: num / den, intercept: my - (num / den) * mx, n } : null;
}

export const sum = (a) => a.reduce((s, v) => s + (v ?? 0), 0);
export const mean = (a) => {
  const v = a.filter((x) => x != null && !Number.isNaN(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};
const pad = (n) => String(n).padStart(2, "0");
