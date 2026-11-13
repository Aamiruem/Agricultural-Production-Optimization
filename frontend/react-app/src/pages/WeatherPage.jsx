import { AlertTriangle, CheckCircle2, CloudSun, Droplets, Info, Sun, Thermometer, Wind } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { PageHeader } from "@/components/common/PageHeader";
import { StateSelect } from "@/components/common/StateSelect";
import { STATE_BY_NAME } from "@/data/indiaAgri";
import { farmAdvisories, useWeather, weatherLabel } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { useChartColors } from "@/lib/chartTheme";

const LEVEL_ICON = { good: CheckCircle2, info: Info, warning: AlertTriangle, serious: AlertTriangle };

export default function WeatherPage() {
  const { t, lang } = useT();
  const c = useChartColors();
  const [stateName, setStateName] = useState("Punjab");
  const [coords, setCoords] = useState(null);
  const place = coords ?? STATE_BY_NAME[stateName];
  const w = useWeather(place);
  const day = (d) => new Date(d).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric" });
  const cur = w.data?.current;
  const wl = cur ? weatherLabel(cur.weather_code, lang) : null;
  const daily = w.data ? [...w.data.past, ...w.data.forecast].map((d) => ({ ...d, label: day(d.date) })) : [];

  const useMyLocation = () => navigator.geolocation?.getCurrentPosition(
    (pos) => setCoords({ lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), capital: lang === "hi" ? "आपका स्थान" : "Your location" }),
    () => setCoords(null),
  );

  return (
    <>
      <PageHeader page="weather" icon={CloudSun} color="#0ea5e9" actions={<div className="d-flex gap-2 align-items-end flex-wrap">
        <StateSelect value={stateName} onChange={(s) => { setCoords(null); setStateName(s); }} />
        <button className="btn btn-outline-primary btn-sm mb-1" onClick={useMyLocation}>{lang === "hi" ? "मेरा स्थान" : "Use my location"}</button>
      </div>} />

      {w.isLoading && <p className="muted">{t("common.loading")}</p>}
      {w.isError && <div className="tool-card"><p className="text-danger mb-0">Could not load live weather: {w.error.message}. Check your connection and try again.</p></div>}
      {cur && <>
        <div className="weather-hero">
          <div className="wh-main">
            <span className="wh-icon">{wl.icon}</span>
            <div><b>{Math.round(cur.temperature_2m)}°C</b><span>{wl.text}</span><small>{place.capital}{coords ? "" : `, ${stateName}`} · feels like {Math.round(cur.apparent_temperature)}°C</small></div>
          </div>
          <div className="wh-facts">
            <Fact icon={Droplets} color="#0ea5e9" label="Humidity" value={`${cur.relative_humidity_2m}%`} />
            <Fact icon={Wind} color="#64748b" label="Wind" value={`${Math.round(cur.wind_speed_10m)} km/h`} />
            <Fact icon={CloudSun} color="#2563eb" label="Rain now" value={`${cur.precipitation} mm`} />
            <Fact icon={Sun} color="#f59e0b" label="UV max" value={w.data.forecast[0]?.uv ?? "—"} />
            <Fact icon={Thermometer} color="#ef4444" label="ET₀ today" value={`${w.data.forecast[0]?.et0 ?? "—"} mm`} />
          </div>
        </div>

        <section className="tool-card">
          <h2>{lang === "hi" ? "7-दिन का पूर्वानुमान" : "7-day forecast"}</h2>
          <div className="forecast-strip">{w.data.forecast.map((d) => { const l = weatherLabel(d.code, lang); return (
            <div key={d.date} className="fc-day"><small>{day(d.date)}</small><span>{l.icon}</span><b>{Math.round(d.max)}° <em>{Math.round(d.min)}°</em></b><small className="rain-chip">💧 {d.rainProb}% · {d.rain} mm</small></div>
          ); })}</div>
        </section>

        <section className="tool-card">
          <h2>{lang === "hi" ? "कृषि सलाह" : "Farm advisories"}</h2>
          <ul className="advisory-list">{farmAdvisories(w.data, lang).map((a) => { const Icon = LEVEL_ICON[a.level]; return <li key={a.text} className={`adv-${a.level}`}><Icon size={18} />{a.text}</li>; })}</ul>
        </section>

        <div className="tool-columns">
          <section className="tool-card">
            <h2>Temperature (°C)</h2><p className="muted">Last 7 days and next 7 days</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={daily} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="label" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} interval={1} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip content={<ChartTooltip unit="°C" />} />
                <Line type="monotone" dataKey="max" name="Max" stroke={c.series[1]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="min" name="Min" stroke={c.series[0]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="legend-inline"><span><i style={{ background: c.series[1] }} />Max</span><span><i style={{ background: c.series[0] }} />Min</span></div>
          </section>
          <section className="tool-card">
            <h2>Rainfall (mm/day)</h2><p className="muted">Last 7 days and next 7 days</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={daily} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="label" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} interval={1} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" mm" />} />
                <Bar dataKey="rain" name="Rainfall" fill={c.series[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
        <section className="tool-card">
          <h2>Humidity — next 24 hours (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={w.data.hourly} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="time" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} interval={2} />
              <YAxis domain={[0, 100]} stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip content={<ChartTooltip unit="%" />} />
              <Area type="monotone" dataKey="humidity" name="Humidity" stroke={c.series[2]} fill={c.series[2]} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
        <p className="source-note">Live data: Open-Meteo forecast API (ECMWF/GFS/IMD-blended models) for {place.capital}. For official warnings see IMD / Mausam and the Meghdoot app.</p>
      </>}
    </>
  );
}

function Fact({ icon: Icon, color, label, value }) {
  return <div className="wh-fact"><span className="icon-badge" style={{ "--c": color }}><Icon size={17} /></span><small>{label}</small><b>{value}</b></div>;
}
