import { Droplets } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { PageHeader } from "@/components/common/PageHeader";
import { StateSelect } from "@/components/common/StateSelect";
import { STATE_BY_NAME } from "@/data/indiaAgri";
import { useWeather } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { KC, METHODS, STAGES, irrigationPlan } from "@/lib/agriModels";
import { useChartColors } from "@/lib/chartTheme";

const ACRE_TO_HA = 0.404686;

export default function IrrigationPage() {
  const { t, lang } = useT();
  const c = useChartColors();
  const [stateName, setStateName] = useState("Maharashtra");
  const [crop, setCrop] = useState("Wheat");
  const [stage, setStage] = useState("Mid-season");
  const [method, setMethod] = useState("Flood");
  const [acres, setAcres] = useState(5);
  const w = useWeather(STATE_BY_NAME[stateName]);

  const plan = useMemo(() => {
    if (!w.data) return null;
    const days = w.data.forecast.slice(0, 7);
    return { forecast: days, ...irrigationPlan({ crop, stage, method, areaHa: acres * ACRE_TO_HA, et0: days.map((d) => d.et0), rain: days.map((d) => d.rain) }) };
  }, [w.data, crop, stage, method, acres]);
  const daily = plan ? plan.forecast.map((d, i) => ({ label: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }), etc: plan.days[i].etc, rain: plan.days[i].effective })) : [];
  const drip = plan?.byMethod.find((m) => m.method === "Drip");
  const flood = plan?.byMethod.find((m) => m.method === "Flood");

  return (
    <>
      <PageHeader page="irrigation" icon={Droplets} color="#0284c7" />
      <div className="yield-layout">
        <section className="tool-card">
          <h2>{lang === "hi" ? "खेत और फसल" : "Field & crop"}</h2>
          <StateSelect value={stateName} onChange={setStateName} />
          <label className="field-label"><span>{t("common.crop")}</span><select value={crop} onChange={(e) => setCrop(e.target.value)}>{Object.keys(KC).map((k) => <option key={k}>{k}</option>)}</select></label>
          <label className="field-label"><span>Growth stage</span>
            <div className="seg light">{STAGES.map((s) => <button key={s} type="button" className={stage === s ? "on" : ""} onClick={() => setStage(s)}>{s}</button>)}</div>
          </label>
          <label className="field-label"><span>Irrigation method</span>
            <div className="seg light">{Object.keys(METHODS).map((m) => <button key={m} type="button" className={method === m ? "on" : ""} onClick={() => setMethod(m)}>{m}</button>)}</div>
          </label>
          <label className="field-label"><span>{t("common.area")} ({t("common.acres")})</span><input type="number" min="0.1" step="0.1" value={acres} onChange={(e) => setAcres(Math.max(0.1, Number(e.target.value) || 0.1))} /></label>
          <p className="muted small mb-0">Crop coefficient Kc = <b>{(KC[crop] || KC.Vegetables)[STAGES.indexOf(stage)]}</b> (FAO-56) · efficiency {Math.round(METHODS[method] * 100)}%</p>
        </section>

        <section className="tool-card">
          <h2>{lang === "hi" ? "अगले 7 दिन की जल आवश्यकता" : "Water requirement — next 7 days"}</h2>
          {w.isLoading && <p className="muted">{t("common.loading")}</p>}
          {w.isError && <p className="text-danger">Live evapotranspiration unavailable: {w.error.message}</p>}
          {plan && <>
            <div className="result-tiles">
              <div className="rt blue"><small>Crop water use (ETc)</small><b>{plan.etcTotal} <em>mm</em></b><span>ET₀ × Kc</span></div>
              <div className="rt green"><small>Effective rain</small><b>{plan.effectiveRain} <em>mm</em></b><span>forecast</span></div>
              <div className="rt amber"><small>Irrigation to apply</small><b>{plan.grossMm} <em>mm</em></b><span>{plan.volumeM3.toLocaleString("en-IN")} m³ · {(plan.volumeM3 * 1000).toLocaleString("en-IN")} L</span></div>
            </div>
            <h3 className="chart-title">Daily crop water use vs effective rain (mm)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="label" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" mm" />} />
                <Bar dataKey="etc" name="Crop water use" fill={c.series[1]} radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="rain" name="Effective rain" fill={c.series[0]} radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div className="legend-inline"><span><i style={{ background: c.series[1] }} />Crop water use</span><span><i style={{ background: c.series[0] }} />Effective rain</span></div>
          </>}
        </section>
      </div>

      {plan && <section className="tool-card">
        <h2>{lang === "hi" ? "सिंचाई विधि की तुलना" : "Compare irrigation methods"}</h2>
        <p className="muted">Same crop need, different application efficiency. {drip && flood && flood.m3 > 0 && <b className="text-success">Drip saves ≈ {(flood.m3 - drip.m3).toLocaleString("en-IN")} m³ ({Math.round((1 - drip.m3 / flood.m3) * 100)}%) this week vs flood.</b>}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={plan.byMethod} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="method" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} width={80} />
            <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" m³" />} />
            <Bar dataKey="m3" name="Water" radius={[0, 4, 4, 0]} barSize={20} label={{ position: "right", fill: c.text, fontSize: 11, formatter: (v) => `${v.toLocaleString("en-IN")} m³` }}>
              {plan.byMethod.map((m) => <Cell key={m.method} fill={m.method === method ? c.series[0] : "#9fb3a8"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>}
      <p className="disclaimer">Method: FAO-56 crop evapotranspiration (ETc = Kc × ET₀) with live ET₀ from Open-Meteo for {STATE_BY_NAME[stateName].capital}; effective rain = 80% of daily rain above 5 mm. Adjust for soil texture, groundwater and canal schedules; check soil moisture before irrigating.</p>
    </>
  );
}
