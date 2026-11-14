// Report export: a flat, fully sourced CSV of an analysis. (PDF = print layout of the page.)
import Papa from "papaparse";

import { isMissing } from "./sources";

const HEADER = ["section", "parameter", "value", "unit", "source", "data_type", "resolution", "observed", "retrieved", "confidence", "note"];

function row(section, parameter, v, unit = "") {
  if (v == null) return [section, parameter, "", unit, "", "", "", "", "", "", "not available"];
  if (typeof v !== "object" || Array.isArray(v)) return [section, parameter, Array.isArray(v) ? v.join("; ") : v, unit, "AgriSmart (computed)", "derived", "", "", "", "", ""];
  if (isMissing(v)) return [section, parameter, "", v.unit ?? unit, v.sourceName ?? "", "unavailable", v.resolution ?? "", "", v.retrievedAt ?? "", "", v.reason ?? "not available"];
  const value = Array.isArray(v.value) ? v.value.join("; ") : typeof v.value === "object" ? JSON.stringify(v.value) : v.value;
  return [section, parameter, value, v.unit ?? unit, v.sourceName ?? "", v.type ?? "", v.resolution ?? "", v.observedAt ?? "", v.retrievedAt ?? "", v.confidence ?? "", v.note ?? ""];
}

/** Rows for a whole analysis: location, climate, soil, agriculture, comparison, crops, yield. */
export function reportRows({ local, comparison, quality, suitability, yieldResult }) {
  const out = [];
  const L = local?.location ?? {};
  out.push(row("Location", "Latitude", local?.point?.[0], "°"));
  out.push(row("Location", "Longitude", local?.point?.[1], "°"));
  for (const k of ["state", "district", "subdistrict", "block", "village", "locality"]) out.push(row("Location", k, L[k]));
  out.push(row("Location", "Selected area", local?.area));

  const c = local?.weather?.current;
  if (c) {
    const meta = { sourceName: "Open-Meteo Forecast API", type: "forecast/nowcast (modelled)", resolution: "~1–11 km model grid", observedAt: c.time, retrievedAt: local.weather.retrievedAt };
    const w = (p, val, unit) => out.push(["Weather (current)", p, val, unit, meta.sourceName, meta.type, meta.resolution, meta.observedAt, meta.retrievedAt, "medium", ""]);
    w("Temperature", c.temperature_2m, "°C");
    w("Feels like", c.apparent_temperature, "°C");
    w("Relative humidity", c.relative_humidity_2m, "%");
    w("Precipitation", c.precipitation, "mm");
    w("Wind speed", c.wind_speed_10m, "km/h");
    w("Wind direction", c.wind_direction_10m, "°");
    w("Surface pressure", c.surface_pressure, "hPa");
    w("Cloud cover", c.cloud_cover, "%");
    w("Shortwave radiation", c.shortwave_radiation, "W/m²");
  }
  const h = local?.history;
  if (h) {
    const meta = ["Open-Meteo Historical (ERA5)", "modelled reanalysis", "~9–25 km grid", `${h.years[0]}–${h.years.at(-1)}`, local.analyzedAt, "medium", ""];
    out.push(["Climate (history)", "Mean annual rainfall", h.annualMean, "mm", ...meta]);
    out.push(["Climate (history)", "Annual rainfall trend", h.trendMmPerYear, "mm/year", ...meta]);
    out.push(["Climate (history)", "Mean temperature", h.meanTemp, "°C", ...meta]);
    out.push(["Climate (history)", "Mean relative humidity", h.meanHumidity, "%", ...meta]);
    for (const s of h.seasonal) out.push(["Climate (history)", `Normal ${s.label} rainfall`, s.rain, "mm", ...meta]);
    if (h.departure) out.push(["Climate (history)", `${h.departure.season} rain to ${h.departure.upTo}`, `${h.departure.actual} mm (${h.departure.pct}% vs normal, ${h.departure.category})`, "", ...meta]);
  }
  for (const f of local?.conditions?.flags ?? []) out.push(["Conditions", f.label, f.detail, "", "Derived from Open-Meteo data", "derived", "point", "", local.analyzedAt, "", ""]);

  const s = local?.soil ?? {};
  for (const [k, label] of [
    ["ph", "Soil pH"],
    ["sand", "Sand"],
    ["silt", "Silt"],
    ["clay", "Clay"],
    ["texture", "Texture class"],
    ["organicCarbon", "Organic carbon"],
    ["totalNitrogen", "Total nitrogen"],
    ["cec", "CEC"],
    ["bulkDensity", "Bulk density"],
    ["waterHolding", "Available water capacity"],
    ["drainage", "Drainage"],
  ])
    if (s[k]) out.push(row("Soil (SoilGrids)", label, s[k]));
  for (const [k, v] of Object.entries(local?.soilUser ?? {})) out.push(row("Soil (your test)", k, v));
  out.push(row("Soil (regional)", "Regional soil classes", local?.soilRegional));

  const st = local?.agriculture?.stats;
  if (st && !isMissing(st)) {
    for (const crop of st.value.crops.slice(0, 10))
      out.push(["Agriculture (state)", `${crop.crop} avg area (last 5 yrs)`, crop.avgAreaHa, "ha", st.sourceName, "observed", "state", st.observedAt, st.retrievedAt, st.confidence, `median yield ${crop.medianYield} t/ha`]);
  }

  if (comparison?.comparison) {
    const cmp = comparison.comparison;
    out.push(["Dataset comparison", "Data match score", cmp.score, "%", "AgriSmart matching", "derived", comparison.matchLevel, "", "", "", cmp.disclaimer]);
    out.push(["Dataset comparison", "Coverage of weighted parameters", cmp.coverage, "%", "AgriSmart matching", "derived", "", "", "", "", ""]);
    for (const r of cmp.rows) out.push(["Dataset comparison", r.label, `dataset=${r.dataset ?? "—"}; local=${r.local ?? "—"}`, r.unit ?? "", "AgriSmart matching", r.status, "", "", "", r.similarity ?? "", `weight ${r.weight}`]);
  }
  if (quality) out.push(["Data quality", "Quality score", quality.score, "%", "AgriSmart validation", "derived", "", "", "", "", quality.issues.slice(0, 5).join(" | ")]);
  for (const cr of suitability?.top ?? []) out.push(["Crop suitability", cr.crop, cr.score, "/100", "AgriSmart suitability engine", "estimated", "location", "", "", "", [...cr.reasons.slice(0, 3), ...cr.cautions.slice(0, 2)].join(" | ")]);
  if (yieldResult) {
    out.push(["Yield prediction", `${yieldResult.crop} yield`, yieldResult.yieldTHa, "t/ha", yieldResult.model, "modelled", yieldResult.resolution, "", "", "", yieldResult.rangeTHa ? `range ${yieldResult.rangeTHa.join("–")} t/ha` : ""]);
    out.push(["Yield prediction", `${yieldResult.crop} production`, yieldResult.productionT, "t", yieldResult.model, "modelled", yieldResult.resolution, "", "", "", yieldResult.formula]);
  }
  return out;
}

export function reportCsv(input) {
  return Papa.unparse({ fields: HEADER, data: reportRows(input) });
}

/** Trigger a file download in the browser. */
export function downloadText(filename, text, type = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
