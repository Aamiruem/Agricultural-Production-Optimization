// State-level choropleth layers for the India map. Each layer says exactly what it shows.
import analytics from "@/data/generated/analytics.json";
import { STATES } from "@/data/indiaAgri";
import { ATLAS_CROPS, ATLAS_STATES } from "@/lib/atlas";

import { normPlace } from "./dataset";
import { fetchPointsWeather } from "./services";

export const RAMP = ["#f7fcf5", "#c7e9c0", "#74c476", "#31a354", "#006d2c"];
export const RAMP_WARM = ["#fff5eb", "#fdd0a2", "#fd8d3c", "#d94801", "#7f2704"];
export const RAMP_BLUE = ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"];

export const MAP_LAYERS = [
  { id: "none", label: "Administrative boundaries only" },
  { id: "temp", label: "Temperature now (state capitals)" },
  { id: "humidity", label: "Humidity now (state capitals)" },
  { id: "rain30", label: "Rainfall, last 30 days (state capitals)" },
  { id: "soil", label: "Dominant regional soil class" },
  { id: "croparea", label: "Cropped area (dataset, latest year)" },
  { id: "suitability", label: "Crop suitability screen (choose crop)" },
];

export const UNAVAILABLE_LAYERS = [
  {
    label: "Irrigation availability",
    reason:
      "No open, verifiable irrigation-coverage API is connected (India-WRIS / Bhuvan layers need agreements or are not machine-readable here). Enter your own irrigation status in the farm form.",
  },
  {
    label: "Village / gram panchayat / block boundaries",
    reason: "No openly licensed national dataset was verified; villages are located as points through OpenStreetMap.",
  },
  {
    label: "Satellite crop-type map",
    reason: "Not connected; ESA WorldCover was unreachable during testing, so it is not shown.",
  },
];

const SOIL_COLORS = {
  Alluvial: "#c7e9c0",
  Black: "#525252",
  Red: "#ef6548",
  Laterite: "#a63603",
  Arid: "#fec44f",
  Sandy: "#fee391",
  Mountain: "#9ecae1",
  Forest: "#41ab5d",
  Loamy: "#8c6d31",
  Saline: "#bcbddc",
  Peaty: "#6a51a3",
  Coastal: "#7fcdbb",
  Other: "#d9d9d9",
};

/** Build a choropleth for a layer id. Network layers fetch live data once and cache it. */
export async function buildChoropleth(id, { crop } = {}) {
  if (id === "none") return null;
  if (["temp", "humidity", "rain30"].includes(id)) {
    const pts = STATES.filter((s) => s.lat != null && s.lon != null).map((s) => ({
      name: s.name,
      lat: s.lat,
      lon: s.lon,
    }));
    const data = await fetchPointsWeather(pts);
    const key = { temp: "temp", humidity: "humidity", rain30: "rain30" }[id];
    const values = Object.fromEntries(data.map((d) => [d.name, d[key]]));
    const spec = {
      temp: { label: "Temperature now", unit: "°C", breaks: [10, 18, 24, 30], ramp: RAMP_WARM },
      humidity: { label: "Relative humidity now", unit: "%", breaks: [30, 45, 60, 75], ramp: RAMP_BLUE },
      rain30: { label: "Rain in the last 30 days", unit: "mm", breaks: [10, 50, 100, 200], ramp: RAMP_BLUE },
    }[id];
    return {
      id,
      ...spec,
      values,
      version: Date.now(),
      note: `Open-Meteo values at each state capital, ${data[0]?.time ?? ""} IST — one point per state, not a state-wide average.`,
    };
  }
  if (id === "soil") {
    const values = {};
    for (const s of STATES) {
      const first = ATLAS_STATES[s.name]?.soils?.[0] ?? (Array.isArray(s.soils) ? s.soils[0] : null);
      if (first)
        values[s.name] =
          Object.keys(SOIL_COLORS).find((k) => String(first).toLowerCase().includes(k.toLowerCase())) ?? "Other";
    }
    const used = new Set(Object.values(values));
    return {
      id,
      label: "Dominant regional soil class",
      categorical: true,
      values,
      colors: Object.fromEntries(Object.entries(SOIL_COLORS).filter(([k]) => used.has(k))),
      note: "AgriSmart state reference table — one class per state; real soils vary within every state.",
    };
  }
  if (id === "croparea") {
    const values = {};
    for (const s of STATES) {
      const entry = Object.entries(analytics.states).find(([k]) => normPlace(k) === normPlace(s.name));
      const last = entry?.[1].years.at(-1);
      if (last) values[s.name] = Math.round(last[1] / 1000);
    }
    return {
      id,
      label: "Cropped area in the dataset",
      unit: "thousand ha",
      breaks: [100, 1000, 3000, 8000],
      ramp: RAMP,
      values,
      note: "Sum of crop areas in crop_yield.csv for each state's latest year (≤ 2020). Grey = state not in the dataset.",
    };
  }
  if (id === "suitability") {
    const c = ATLAS_CROPS.find((x) => x.name === crop) ?? ATLAS_CROPS.find((x) => x.name === "Wheat");
    const values = {};
    for (const s of STATES) {
      const ref = ATLAS_STATES[s.name];
      if (!ref?.rain || !ref?.temp) continue;
      const t = Math.max(0, 1 - Math.abs(ref.temp - c.temp) / 8);
      const r = ref.rain >= c.rain ? (ref.rain / c.rain > 2.5 ? 0.6 : 1) : ref.rain / c.rain;
      values[s.name] = Math.round(((t + r) / 2) * 100);
    }
    return {
      id,
      label: `Climate screen for ${c.name}`,
      unit: "/100",
      breaks: [40, 55, 70, 85],
      ramp: RAMP,
      values,
      version: c.name,
      note: "Screening only: state reference temperature and rainfall vs crop needs (rain-fed). Use Analyze My Area for a location-specific score.",
    };
  }
  return null;
}
