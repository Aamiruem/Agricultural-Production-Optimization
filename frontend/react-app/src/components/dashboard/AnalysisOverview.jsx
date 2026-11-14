import { CloudRain, Database, Layers, MapPin, Sprout, Thermometer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { IconBadge } from "@/components/common/IconBadge";
import { loadLastAnalysis } from "@/features/local/lastAnalysis";
import { G } from "@/lib/icons";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;

/**
 * Overview cards from the user's latest Local Intelligence analysis (stored in this browser).
 * Nothing is invented: a value that was not fetched shows as "Not available".
 */
export function AnalysisOverview() {
  const [a] = useState(loadLastAnalysis);
  const na = "Not available";

  const cards = a
    ? [
        {
          icon: MapPin,
          color: G.green,
          label: "Selected location",
          value: a.place ?? na,
          note: a.point ? `${a.point[0]}, ${a.point[1]}` : "",
        },
        {
          icon: Thermometer,
          color: G.red,
          label: "Temperature",
          value: a.temperature != null ? `${a.temperature} °C` : na,
          note: a.weatherTime ? `Open-Meteo model, ${a.weatherTime} IST` : "Weather lookup failed",
        },
        {
          icon: CloudRain,
          color: G.cyan,
          label: "Rainfall (annual mean)",
          value: a.annualRain != null ? `${a.annualRain.toLocaleString("en-IN")} mm` : na,
          note: a.rainYears ? `${a.rainYears}-year ERA5 history` : "Climate history unavailable",
        },
        {
          icon: Layers,
          color: G.yellow,
          label: "Soil",
          value: a.soilTexture ?? na,
          note: a.soilNote ?? (a.soilTexture ? "SoilGrids texture class" : ""),
        },
        {
          icon: Sprout,
          color: G.green,
          label: "Recommended crops",
          value: a.crops?.length ? a.crops.slice(0, 3).join(", ") : "Not run yet",
          note: a.crops?.length ? "From crop suitability" : "Run crop suitability",
        },
        {
          icon: Database,
          color: G.purple,
          label: "Data matching status",
          value: a.match ? (a.match.score != null ? `${a.match.score}% match` : "No matching records") : "Not run yet",
          note: a.match?.records ? `${a.match.records} records · ${a.match.level}` : "Compare with a dataset",
        },
      ]
    : null;

  return (
    <section className="dash-overview" aria-labelledby="overview-title">
      <div className="dash-overview-head">
        <h2 id="overview-title">Your latest analysis</h2>
        {a?.savedAt && <small>Updated {fmtDate(a.savedAt)} · stored in this browser</small>}
        <Link to="/local-intelligence#map" className="btn btn-tonal btn-sm">
          {a ? "Analyse another location" : "Analyse a location"}
        </Link>
      </div>
      {cards ? (
        <div className="dash-kpis">
          {cards.map((c) => (
            <div key={c.label} className="g-card kpi">
              <IconBadge icon={c.icon} color={c.color} />
              <span className="kpi-label">{c.label}</span>
              <b className="kpi-value">{c.value}</b>
              <small>{c.note}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-empty">
          No location analysed yet. Open <Link to="/local-intelligence#map">Location Analysis</Link>, pick your farm on
          the India map and run <b>Analyze My Area</b> — your location, weather, rainfall, soil, recommended crops and
          data-matching result will appear here.
        </div>
      )}
    </section>
  );
}
