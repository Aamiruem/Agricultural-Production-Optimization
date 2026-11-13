import { BrainCircuit, CalendarCheck, CloudRain, Droplets, Gauge, LayoutDashboard, Layers, Leaf, MapPinned, Sprout, Thermometer, TrendingUp, Wheat, Wind } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { IconBadge } from "@/components/common/IconBadge";
import { MIcon } from "@/components/common/MIcon";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { G } from "@/lib/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { StateSelect } from "@/components/common/StateSelect";
import analytics from "@/data/generated/analytics.json";
import metrics from "@/data/generated/modelMetrics.json";
import { SOIL_BY_ID, STATE_BY_NAME, cropsForState, datasetStateName } from "@/data/indiaAgri";
import { useWeather, weatherLabel } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { predictYieldLocal, seasonsFor } from "@/lib/agriModels";
import { compact, useChartColors } from "@/lib/chartTheme";

const TASKS_BY_MONTH = [
  ["Irrigate rabi wheat at crown-root stage", "Top-dress urea in wheat", "Monitor aphids in mustard"],
  ["Watch for yellow rust in wheat", "Irrigate chickpea at pod-filling", "Prepare land for zaid crops"],
  ["Harvest mustard and chickpea", "Sow zaid moong and melons", "Soil test before kharif"],
  ["Harvest wheat; avoid residue burning", "Summer ploughing", "Irrigate zaid vegetables"],
  ["Deep summer ploughing", "Repair bunds and channels", "Buy certified kharif seed"],
  ["Raise rice nursery", "Sow cotton, soybean, maize with monsoon", "Seed treatment before sowing"],
  ["Transplant paddy", "First weeding in kharif crops", "Drain excess water"],
  ["Top-dress nitrogen in rice", "Scout for stem borer and blast", "Weed control in soybean"],
  ["Monitor pests in cotton", "Plan rabi seed and fertilizer", "Harvest early kharif crops"],
  ["Harvest paddy and soybean", "Sow mustard and chickpea", "Prepare wheat seedbed"],
  ["Sow wheat (optimal window)", "First irrigation in rabi crops", "Manage crop residue with happy seeder"],
  ["Weed control in wheat", "Frost protection for vegetables", "Irrigate rabi crops"],
];
const TASK_COLORS = [G.green, G.blue, G.yellow];

export default function DashboardPage() {
  const { t, lang } = useT();
  const [stateName, setStateName] = useState("Madhya Pradesh");
  const [metric, setMetric] = useState("production");
  const c = useChartColors();
  const state = STATE_BY_NAME[stateName];
  const data = analytics.states[datasetStateName(stateName)];
  const weather = useWeather(state);

  const view = useMemo(() => {
    if (!data) return null;
    const years = data.years.map(([year, area, production, rain]) => ({ year, area, production, rain, yield: area ? +(production / area).toFixed(2) : 0 }));
    const last = years.at(-1);
    const prev = years.at(-2);
    const top = data.top.slice(0, 6).map(([crop, area, production, y]) => ({ crop, area, production, yield: y }));
    const totalTop = data.top.reduce((s, r) => s + r[1], 0);
    const shown = top.reduce((s, r) => s + r.area, 0);
    const pie = [...top.map((r) => ({ name: r.crop, value: r.area })), ...(totalTop - shown > 0 ? [{ name: "Other", value: totalTop - shown }] : [])];
    const seasons = Object.entries(data.seasons).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const lead = top[0]?.crop;
    const leadSeason = lead ? seasonsFor(datasetStateName(stateName), lead)[0] : null;
    let forecast = null;
    if (lead && leadSeason) {
      try { forecast = { crop: lead, season: leadSeason, ...predictYieldLocal({ state: datasetStateName(stateName), crop: lead, season: leadSeason, year: new Date().getFullYear(), area_ha: 1 }) }; } catch { forecast = null; }
    }
    return { years, last, prev, top, pie, seasons, forecast };
  }, [data, stateName]);

  const month = new Date().getMonth();
  const tasks = TASKS_BY_MONTH[month].map((text, i) => ({ text, when: new Date(new Date().getFullYear(), month, 6 + i * 8) }));
  const cur = weather.data?.current;
  const wl = cur ? weatherLabel(cur.weather_code, lang) : null;
  const metricLabel = { production: "Production (t)", area: "Area (ha)", yield: "Yield (t/ha)" }[metric];
  const change = view && view.prev ? ((view.last.production - view.prev.production) / view.prev.production) * 100 : 0;
  const soilNames = state.soils.map((s) => SOIL_BY_ID[s]);

  return (
    <div className="dash">
      <PageHeader page="dashboard" icon="space_dashboard" color={G.blue} actions={<div className="dash-actions"><Link to="/data-dashboard" className="btn btn-tonal"><MIcon name="upload_file" size={20} /> {lang === "hi" ? "अपना डेटा अपलोड करें" : "Upload your data"}</Link><StateSelect value={stateName} onChange={setStateName} className="dash-state" /></div>} />

      <section className="dash-kpis">
        <Kpi icon="landscape" color={G.green} label="Cultivated area" value={view ? `${compact(view.last.area)} ha` : "—"} note={view ? `${view.last.year} records` : "No dataset records"} />
        <Kpi icon="grass" color={G.yellow} label="Total production" value={view ? `${compact(view.last.production)} t` : "—"} note={view ? `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}% vs ${view.prev?.year}` : "—"} tone={change >= 0 ? "up" : "down"} />
        <Kpi icon="potted_plant" color={G.blue} label="Crops recorded" value={data ? data.crops.length : cropsForState(stateName).length} note={`${cropsForState(stateName).length} in crop library`} />
        <Kpi icon="rainy" color={G.cyan} label="Normal rainfall" value={`${state.rainfall.toLocaleString("en-IN")} mm`} note={state.zone} />
        <Kpi icon="trending_up" color={G.purple} label="Leading crop" value={view?.top[0]?.crop ?? state.kharif[0]} note={view?.top[0] ? `${view.top[0].yield} t/ha · ${compact(view.top[0].area)} ha` : "From state profile"} />
      </section>

      <section className="dash-grid">
        <div className="g-card span-8">
          <div className="card-head2">
            <div><h2>{lang === "hi" ? "उत्पादन रुझान" : "Production overview"}</h2><p>{stateName} · {view ? `${view.years[0].year}–${view.last.year}` : ""} · all crops</p></div>
            <div className="seg" role="tablist" aria-label="Metric">
              {["production", "area", "yield"].map((m) => <button key={m} role="tab" aria-selected={metric === m} className={metric === m ? "on" : ""} onClick={() => setMetric(m)}>{m === "production" ? "Production" : m === "area" ? "Area" : "Yield"}</button>)}
            </div>
          </div>
          {view ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={view.years} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.primary} stopOpacity={0.45} /><stop offset="100%" stopColor={c.primary} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="year" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} tickFormatter={compact} width={52} />
                <Tooltip content={<ChartTooltip format={(v) => v.toLocaleString("en-IN")} />} />
                <Area type="monotone" dataKey={metric} name={metricLabel} stroke={c.primary} strokeWidth={2} fill="url(#dashArea)" activeDot={{ r: 5, strokeWidth: 2, stroke: c.surface }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData state={stateName} />}
        </div>

        <div className="g-card span-4 weather-glass">
          <div className="card-head2"><div><h2>{lang === "hi" ? "आज का मौसम" : "Weather today"}</h2><p>{state.capital}, {stateName}</p></div><span className="live-pill">● {t("common.live")}</span></div>
          {weather.isLoading && <p className="muted">{t("common.loading")}</p>}
          {weather.isError && <p className="muted">Live weather unavailable right now.</p>}
          {cur && <>
            <div className="wx-now"><span className="wx-icon">{wl.icon}</span><div><b>{Math.round(cur.temperature_2m)}°C</b><span>{wl.text}</span></div></div>
            <div className="wx-facts">
              <span><Droplets size={15} /> {cur.relative_humidity_2m}%<small>Humidity</small></span>
              <span><Wind size={15} /> {Math.round(cur.wind_speed_10m)} km/h<small>Wind</small></span>
              <span><CloudRain size={15} /> {cur.precipitation} mm<small>Rain</small></span>
            </div>
            <div className="wx-days">{weather.data.forecast.slice(0, 5).map((d) => <div key={d.date}><small>{new Date(d.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short" })}</small><span>{weatherLabel(d.code).icon}</span><b>{Math.round(d.max)}°</b><small>{Math.round(d.min)}°</small></div>)}</div>
          </>}
          <Link to="/weather" className="card-link">Full forecast →</Link>
        </div>

        <div className="g-card span-4">
          <div className="card-head2"><div><h2>{lang === "hi" ? "फसल वितरण" : "Crop distribution"}</h2><p>By cultivated area, last 3 years</p></div></div>
          {view ? <>
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={view.pie} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={1.5} stroke={c.surface} strokeWidth={2}>
                    {view.pie.map((p, i) => <Cell key={p.name} fill={p.name === "Other" ? c.muted : c.series[i]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip format={(v) => `${compact(v)} ha`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><b>{compact(view.pie.reduce((s, p) => s + p.value, 0))}</b><small>ha / yr</small></div>
            </div>
            <ul className="legend-list">{view.pie.map((p, i) => <li key={p.name}><i style={{ background: p.name === "Other" ? c.muted : c.series[i] }} />{p.name}<b>{((p.value / view.pie.reduce((s, x) => s + x.value, 0)) * 100).toFixed(0)}%</b></li>)}</ul>
          </> : <NoData state={stateName} />}
        </div>

        <div className="g-card span-4">
          <div className="card-head2"><div><h2>{lang === "hi" ? "AI उपज पूर्वानुमान" : "AI yield forecast"}</h2><p>{view?.forecast ? `${view.forecast.crop} · ${view.forecast.season} · ${new Date().getFullYear()}` : "Leading crop"}</p></div><BrainCircuit size={20} className="text-glow" /></div>
          {view?.forecast ? <>
            <div className="forecast-big"><b>{view.forecast.yield_t_ha}</b><span>t/ha predicted</span></div>
            <p className="muted small">Planning band {view.forecast.low_t_ha}–{view.forecast.high_t_ha} t/ha · trend {view.forecast.trend_pct_per_year > 0 ? "+" : ""}{view.forecast.trend_pct_per_year}%/yr</p>
            {view.forecast.history && <ResponsiveContainer width="100%" height={130}>
              <BarChart data={[{ k: "Low (P25)", v: view.forecast.history.p25 }, { k: "Median", v: view.forecast.history.median }, { k: "AI forecast", v: view.forecast.yield_t_ha }, { k: "High (P75)", v: view.forecast.history.p75 }]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="k" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" t/ha" />} />
                <Bar dataKey="v" name="Yield" radius={[4, 4, 0, 0]} maxBarSize={34}>
                  {[c.muted, c.muted2, c.primary, c.muted].map((f, i) => <Cell key={i} fill={f} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
            <p className="muted tiny">Model R² {metrics.yield.r2_log} (log) · median error {(metrics.yield.median_ape * 100).toFixed(0)}% on 2015–2020 hold-out.</p>
          </> : <NoData state={stateName} />}
          <Link to="/yield-prediction" className="card-link">Run a custom prediction →</Link>
        </div>

        <div className="g-card span-4">
          <div className="card-head2"><div><h2>{lang === "hi" ? "मौसम-वार क्षेत्र" : "Season share"}</h2><p>Share of cultivated area</p></div></div>
          {view ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={view.seasons} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} width={80} />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit="%" />} />
                <Bar dataKey="value" name="Area share" fill={c.series[0]} radius={[0, 4, 4, 0]} barSize={16} label={{ position: "right", fill: c.text, fontSize: 11, formatter: (v) => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData state={stateName} />}
        </div>

        <div className="g-card span-6">
          <div className="card-head2"><div><h2>{lang === "hi" ? "शीर्ष फसलें — उपज" : "Top crops by yield"}</h2><p>Average t/ha, last 3 years</p></div><TrendingUp size={20} className="text-glow" /></div>
          {view ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={view.top} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="crop" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} interval={0} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" t/ha" />} />
                <Bar dataKey="yield" name="Yield" radius={[4, 4, 0, 0]} maxBarSize={38}>{view.top.map((r, i) => <Cell key={r.crop} fill={c.series[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData state={stateName} />}
        </div>

        <div className="g-card span-3">
          <div className="card-head2"><div><h2>{lang === "hi" ? "मिट्टी सारांश" : "Soil summary"}</h2><p>Dominant soil types</p></div><Leaf size={20} className="text-glow" /></div>
          <ul className="soil-list">{soilNames.map((s) => <li key={s.id}><i style={{ background: s.color }} /><div><b>{lang === "hi" ? s.hi : s.en}</b><small>pH {s.ph} · {s.npk}</small></div></li>)}</ul>
          <Link to="/soil-analysis" className="card-link">Analyse your soil →</Link>
        </div>

        <div className="g-card span-3">
          <div className="card-head2"><div><h2>{lang === "hi" ? "आगामी कार्य" : "Upcoming tasks"}</h2><p>{new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long" })} farm calendar</p></div><CalendarCheck size={20} className="text-glow" /></div>
          <ul className="task-list">{tasks.map((task, i) => <li key={task.text}><i style={{ background: TASK_COLORS[i] }} /><span>{task.text}</span><small>{task.when.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></li>)}</ul>
        </div>

        <div className="g-card span-12">
          <div className="card-head2"><div><h2>{lang === "hi" ? "वार्षिक वर्षा" : "Annual rainfall"}</h2><p>{stateName} · mm per year (dataset)</p></div><Thermometer size={20} className="text-glow" /></div>
          {view ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={view.years} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="year" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" mm" />} />
                <Bar dataKey="rain" name="Rainfall" fill={c.series[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData state={stateName} />}
        </div>

        <div className="g-card span-12 dash-crops">
          <div className="card-head2"><div><h2>{lang === "hi" ? `${state.hi} की प्रमुख फसलें` : `Major crops of ${stateName}`}</h2><p>Kharif · Rabi · Horticulture</p></div><MapPinned size={20} className="text-glow" /></div>
          <div className="season-cols">
            <div><h3>🌧️ Kharif</h3><p>{state.kharif.join(" · ")}</p></div>
            <div><h3>❄️ Rabi</h3><p>{state.rabi.join(" · ")}</p></div>
            <div><h3>🍎 Horticulture & specialties</h3><p>{state.horticulture.join(" · ")}</p></div>
          </div>
          <Link to={`/states?state=${encodeURIComponent(stateName)}`} className="card-link">Open the full state advisor →</Link>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon, color, label, value, note, tone }) {
  return (
    <div className="g-card kpi">
      <IconBadge icon={icon} color={color} />
      <span className="kpi-label">{label}</span>
      <b className="kpi-value">{value}</b>
      <small className={tone ? `kpi-${tone}` : ""}>{note}</small>
    </div>
  );
}

function NoData({ state }) {
  return <div className="card-empty">No historical yield records for {state} in the bundled dataset. Crop and soil guidance below still applies.</div>;
}
