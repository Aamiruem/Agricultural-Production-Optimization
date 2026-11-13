import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { MIcon } from "@/components/common/MIcon";
import { PageHeader } from "@/components/common/PageHeader";
import { StateSelect } from "@/components/common/StateSelect";
import { STATE_BY_NAME } from "@/data/indiaAgri";
import { useWeather } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { ADVISOR_SEASONS, ATLAS_SOILS, ATLAS_STATES, WATER_LEVELS, advisorSeason, recommendSeasonalCrops } from "@/lib/atlas";
import { useChartColors } from "@/lib/chartTheme";
import { G } from "@/lib/icons";

const PART_LABELS = { season: "Season", soil: "Soil", state: "State fit", water: "Water", temperature: "Temperature", rainfall: "Rainfall" };
const PART_MAX = { season: 30, soil: 24, state: 18, water: 14, temperature: 9, rainfall: 5 };

/** Rank crops for a state, season, soil, water availability and climate. */
export default function SeasonalAdvisorPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const c = useChartColors();
  const [state, setState] = useState("Uttar Pradesh");
  const sp = ATLAS_STATES[state];
  const [season, setSeason] = useState(advisorSeason());
  const [soil, setSoil] = useState(sp?.soils[0] ?? "Alluvial");
  const [water, setWater] = useState("Medium");
  const [temp, setTemp] = useState(sp?.temp ?? 25);
  const [rain, setRain] = useState(sp?.rain ?? 1000);
  const [live, setLive] = useState(false);
  const weather = useWeather(live ? STATE_BY_NAME[state] : null);

  const pickState = (s) => {
    setState(s);
    const p = ATLAS_STATES[s];
    if (p) { setSoil(p.soils[0]); setTemp(p.temp); setRain(p.rain); }
    setLive(false);
  };
  const liveTemp = live && weather.data ? Math.round(weather.data.current.temperature_2m) : null;
  const ranked = useMemo(() => recommendSeasonalCrops({ state, season, soil, water, temperature: liveTemp ?? temp, rainfall: rain }), [state, season, soil, water, temp, rain, liveTemp]);
  const chart = ranked.map((r) => ({ crop: r.name, score: r.score }));

  return (
    <>
      <PageHeader
        title={hi ? "मौसमी फसल सलाहकार" : "Seasonal advisor"}
        description={hi ? "राज्य, मौसम, मिट्टी, पानी, तापमान और वर्षा से फसलों की पारदर्शी रैंकिंग।" : "Rank crops by state, season, soil, water, temperature and rainfall with a transparent score."}
        icon="tips_and_updates" color={G.yellow}
      />
      <div className="yield-layout">
        <section className="tool-card">
          <h2>{hi ? "आपकी स्थिति" : "Your conditions"}</h2>
          <StateSelect value={state} onChange={pickState} />
          <label className="field-label"><span>{hi ? "मौसम" : "Season"}</span>
            <div className="seg">{ADVISOR_SEASONS.map((s) => <button key={s} type="button" className={season === s ? "on" : ""} onClick={() => setSeason(s)}>{s}</button>)}</div>
          </label>
          <label className="field-label"><span>{hi ? "मिट्टी" : "Soil type"}</span>
            <select value={soil} onChange={(e) => setSoil(e.target.value)}>
              {ATLAS_SOILS.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.hi}{sp?.soils.includes(s.id) ? " ★" : ""}</option>)}
            </select>
          </label>
          <label className="field-label"><span>{hi ? "पानी की उपलब्धता" : "Water available"}</span>
            <div className="seg">{WATER_LEVELS.map((w) => <button key={w} type="button" className={water === w ? "on" : ""} onClick={() => setWater(w)}>{w}</button>)}</div>
          </label>
          <label className="range-label"><span>{hi ? "औसत तापमान" : "Mean temperature"}</span><b>{liveTemp ?? temp} °C{liveTemp !== null && " · live"}</b>
            <input type="range" min="5" max="40" step="0.5" value={liveTemp ?? temp} disabled={liveTemp !== null} onChange={(e) => setTemp(Number(e.target.value))} /></label>
          <label className="range-label"><span>{hi ? "वार्षिक वर्षा" : "Annual rainfall"}</span><b>{rain} mm</b>
            <input type="range" min="100" max="3500" step="50" value={rain} onChange={(e) => setRain(Number(e.target.value))} /></label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setLive((v) => !v)}>
            <MIcon name="partly_cloudy_day" size={18} /> {live ? (hi ? "लाइव तापमान बंद करें" : "Stop using live temperature") : (hi ? "लाइव तापमान उपयोग करें" : "Use live temperature")}
          </button>
          {live && weather.isError && <p className="field-error mt-2">Live weather unavailable.</p>}
          <p className="muted small mt-3 mb-0">★ {hi ? "राज्य की प्रमुख मिट्टी" : "dominant soil in this state"} · {sp?.zone}</p>
        </section>

        <section className="tool-card">
          <div className="card-head"><h2>{hi ? "सर्वोत्तम फसलें" : "Best crops"} · {state} · {season}</h2><span className="engine-chip">0–100 suitability</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
              <YAxis type="category" dataKey="crop" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} width={100} />
              <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit="/100" />} />
              <Bar dataKey="score" name="Suitability" fill={c.series[0]} radius={[0, 4, 4, 0]} barSize={14} label={{ position: "right", fill: c.text, fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
          <ol className="advisor-list">
            {ranked.slice(0, 6).map((r, i) => (
              <li key={r.name}>
                <img src={r.image} alt="" width="64" height="64" loading="lazy" />
                <div className="advisor-text">
                  <div className="d-flex justify-content-between gap-2"><b>#{i + 1} {r.name} · {r.hi}</b><span className="advisor-score">{r.score}</span></div>
                  <small>{r.why.join(" · ")}</small>
                  <div className="score-parts" aria-label="Score breakdown">
                    {Object.entries(r.parts).map(([k, v]) => <span key={k} title={`${PART_LABELS[k]} ${v.toFixed(1)} / ${PART_MAX[k]}`} style={{ flexGrow: PART_MAX[k] }}><i style={{ width: `${(v / PART_MAX[k]) * 100}%` }} /></span>)}
                  </div>
                  <small className="muted">{r.water} water · {r.temp} °C · {r.rain} mm · ref. {r.yield} t/ha</small>
                </div>
              </li>
            ))}
          </ol>
          <p className="muted tiny mb-0">Bar segments: season 30 · soil 24 · state fit 18 · water 14 · temperature 9 · rainfall 5.</p>
        </section>
      </div>
      <p className="disclaimer">The score is a transparent rule-based ranking, not a guarantee. Confirm varieties and sowing dates with your KVK.</p>
    </>
  );
}
