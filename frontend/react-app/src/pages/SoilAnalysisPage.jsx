import { AlertTriangle, CheckCircle2, FlaskConical, Sprout } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { G } from "@/lib/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { CROPS, SOIL_TYPES } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";
import { SOIL_RATINGS, rateNutrient, soilHealth } from "@/lib/agriModels";
import { useChartColors } from "@/lib/chartTheme";

const STATUS = {
  low: { label: "Low", hi: "कम", cls: "st-serious" },
  medium: { label: "Medium", hi: "मध्यम", cls: "st-good" },
  high: { label: "High", hi: "अधिक", cls: "st-warning" },
};
const GRADE_COLOR = { excellent: "#16a34a", good: "#65a30d", average: "#d97706", poor: "#dc2626" };
const SAMPLES = [
  { label: "Punjab alluvial", v: { N: 240, P: 18, K: 260, oc: 0.45, ph: 7.9, ec: 0.4, soil: "alluvial" } },
  { label: "Vidarbha black", v: { N: 210, P: 9, K: 380, oc: 0.55, ph: 8.1, ec: 0.6, soil: "black" } },
  { label: "Kerala laterite", v: { N: 320, P: 12, K: 95, oc: 1.1, ph: 5.1, ec: 0.2, soil: "laterite" } },
];

export default function SoilAnalysisPage() {
  const { lang } = useT();
  const c = useChartColors();
  const [v, setV] = useState({ N: 280, P: 15, K: 180, oc: 0.6, ph: 6.8, ec: 0.5, soil: "alluvial" });
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: k === "soil" ? e.target.value : Number(e.target.value) }));
  const h = useMemo(() => soilHealth(v), [v]);
  const soilType = SOIL_TYPES.find((s) => s.id === v.soil);
  const suited = CROPS.filter((cr) => cr.soils.includes(v.soil)).slice(0, 14);

  const radar = [
    { k: "Nitrogen", you: Math.min(100, (v.N / SOIL_RATINGS.N.ideal) * 70), ideal: 70 },
    { k: "Phosphorus", you: Math.min(100, (v.P / SOIL_RATINGS.P.ideal) * 70), ideal: 70 },
    { k: "Potassium", you: Math.min(100, (v.K / SOIL_RATINGS.K.ideal) * 70), ideal: 70 },
    { k: "Organic C", you: Math.min(100, (v.oc / SOIL_RATINGS.oc.ideal) * 70), ideal: 70 },
    { k: "pH balance", you: h.parts.ph * 0.7, ideal: 70 },
    { k: "Low salinity", you: h.parts.ec * 0.7, ideal: 70 },
  ].map((r) => ({ ...r, you: Math.round(r.you) }));
  const bars = Object.entries(h.parts).map(([k, val]) => ({
    k: { N: "N", P: "P", K: "K", oc: "OC", ph: "pH", ec: "EC" }[k],
    v: Math.round(val),
  }));

  return (
    <>
      <PageHeader page="soil" icon="science" color={G.brown} />
      <div className="sample-row">
        <span className="muted">Try a sample:</span>
        {SAMPLES.map((s) => (
          <button key={s.label} className="chip" onClick={() => setV(s.v)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="yield-layout">
        <section className="tool-card">
          <h2>{lang === "hi" ? "मिट्टी परीक्षण मान" : "Soil test values"}</h2>
          <p className="muted">Enter values from your Soil Health Card or lab report.</p>
          <label className="field-label">
            <span>Soil type</span>
            <select value={v.soil} onChange={set("soil")}>
              {SOIL_TYPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {lang === "hi" ? s.hi : s.en}
                </option>
              ))}
            </select>
          </label>
          {[
            ["N", "Available nitrogen (N)", "kg/ha", 0, 800, 5],
            ["P", "Available phosphorus (P)", "kg/ha", 0, 60, 0.5],
            ["K", "Available potassium (K)", "kg/ha", 0, 600, 5],
            ["oc", "Organic carbon", "%", 0, 2, 0.05],
            ["ph", "Soil pH", "", 3.5, 10.5, 0.1],
            ["ec", "Electrical conductivity (EC)", "dS/m", 0, 6, 0.1],
          ].map(([k, label, unit, min, max, step]) => {
            const rating = SOIL_RATINGS[k] ? rateNutrient(k, v[k]) : null;
            return (
              <label key={k} className="range-label">
                <span>
                  {label}
                  {rating && (
                    <em className={`status-pill ${STATUS[rating].cls}`}>
                      {lang === "hi" ? STATUS[rating].hi : STATUS[rating].label}
                    </em>
                  )}
                </span>
                <b>
                  {v[k]} {unit}
                </b>
                <input type="range" min={min} max={max} step={step} value={v[k]} onChange={set(k)} />
              </label>
            );
          })}
        </section>

        <section className="tool-card">
          <div className="score-row">
            <div className="gauge">
              <ResponsiveContainer width="100%" height={190}>
                <RadialBarChart
                  innerRadius="72%"
                  outerRadius="100%"
                  data={[{ v: h.score, fill: GRADE_COLOR[h.grade] }]}
                  startAngle={220}
                  endAngle={-40}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="v" cornerRadius={8} background={{ fill: c.grid }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="gauge-center">
                <b>{h.score}</b>
                <small>/100</small>
                <span style={{ color: GRADE_COLOR[h.grade] }}>{h.grade}</span>
              </div>
            </div>
            <div className="score-text">
              <h2>{lang === "hi" ? "मृदा स्वास्थ्य स्कोर" : "Soil health score"}</h2>
              <p className="muted">
                Weighted from N, P, K, organic carbon, pH and salinity using Indian Soil Health Card rating limits.
              </p>
              <div className="soil-type-chip" style={{ "--c": soilType.color }}>
                <i />
                {lang === "hi" ? soilType.hi : soilType.en} · pH {soilType.ph}
              </div>
            </div>
          </div>
          <div className="two-col">
            <div>
              <h3 className="chart-title">Profile vs ideal</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radar} outerRadius="75%">
                  <PolarGrid stroke={c.grid} />
                  <PolarAngleAxis dataKey="k" tick={{ fill: c.axis, fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Ideal" dataKey="ideal" stroke={c.axis} fill="none" strokeDasharray="4 4" />
                  <Radar
                    name="Your soil"
                    dataKey="you"
                    stroke={c.series[0]}
                    fill={c.series[0]}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="chart-title">Parameter scores</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bars} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke={c.grid} vertical={false} />
                  <XAxis dataKey="k" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit="/100" />} />
                  <Bar dataKey="v" name="Score" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {bars.map((b) => (
                      <Cell key={b.k} fill={b.v >= 75 ? "#16a34a" : b.v >= 50 ? "#d97706" : "#dc2626"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      <div className="tool-columns">
        <section className="tool-card">
          <h2>{lang === "hi" ? "सुधार के सुझाव" : "Recommendations"}</h2>
          {h.issues.length ? (
            <ul className="advice-list">
              {h.issues.map((i) => (
                <li key={i.key}>
                  <AlertTriangle size={17} className="text-warning" />
                  {i.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ok-line">
              <CheckCircle2 size={18} /> All parameters are within the medium/optimal range. Maintain with organic
              manure and balanced fertilizer.
            </p>
          )}
          <ul className="advice-list subtle">
            {soilType.tips.map((tip) => (
              <li key={tip}>
                <Sprout size={16} />
                {tip}
              </li>
            ))}
          </ul>
          <Link to="/fertilizer" className="btn btn-outline-success btn-sm mt-2">
            Calculate fertilizer doses →
          </Link>
        </section>
        <section className="tool-card">
          <h2>{lang === "hi" ? "इस मिट्टी के लिए उपयुक्त फसलें" : `Crops suited to ${soilType.en} soil`}</h2>
          <div className="mini-crops">
            {suited.map((cr) => (
              <span key={cr.id}>
                <em>{cr.emoji}</em>
                {lang === "hi" ? cr.hi : cr.en}
              </span>
            ))}
          </div>
          <p className="muted small mt-3">
            {soilType.texture}. {soilType.npk}.
          </p>
          <Link to="/soil-types" className="small">
            Explore all Indian soil types →
          </Link>
        </section>
      </div>
      <p className="disclaimer">
        Ratings follow commonly used Indian Soil Health Card limits (N 280–560, P 10–25, K 110–280 kg/ha; OC 0.5–0.75%).
        Lab methods and units vary; confirm amendments with your soil testing lab or KVK.
      </p>
    </>
  );
}
