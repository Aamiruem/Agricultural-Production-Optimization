import { ChartNoAxesCombined, FileDown, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { PageHeader } from "@/components/common/PageHeader";
import analytics from "@/data/generated/analytics.json";
import { useT } from "@/i18n/useT";
import { trackEvent } from "@/lib/analytics";
import { compact, useChartColors } from "@/lib/chartTheme";

const STATES = Object.keys(analytics.states).sort();

function downloadCsv(name, rows) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t, lang } = useT();
  const c = useChartColors();
  const [state, setState] = useState("Punjab");
  const [compare, setCompare] = useState("Haryana");
  const [from, setFrom] = useState(2005);
  const s = analytics.states[state];
  const years = useMemo(() => s.years.filter(([y]) => y >= from).map(([year, area, production, rain]) => ({ year, area, production, rain, yield: +(production / area).toFixed(2) })), [s, from]);
  const other = analytics.states[compare];
  const yieldCompare = years.map((r) => {
    const o = other?.years.find(([y]) => y === r.year);
    return { year: r.year, [state]: r.yield, [compare]: o ? +(o[2] / o[1]).toFixed(2) : null };
  });
  const top = s.top.map(([crop, area, production, y]) => ({ crop, area, production, yield: y }));
  const first = years[0]; const last = years.at(-1);
  const growth = first && last ? ((last.production / first.production - 1) * 100).toFixed(1) : 0;
  const csvRows = [["Year", "Area (ha)", "Production (t)", "Yield (t/ha)", "Rainfall (mm)"], ...years.map((r) => [r.year, r.area, r.production, r.yield, r.rain])];

  return (
    <div className="report-page">
      <PageHeader page="reports" icon={ChartNoAxesCombined} color="#7c3aed" actions={<div className="d-flex gap-2 no-print">
        <button className="btn btn-cta btn-sm" onClick={() => { trackEvent("report_pdf", { state }); window.print(); }}><Printer size={16} /> {t("common.printPdf")}</button>
        <button className="btn btn-outline-success btn-sm" onClick={() => { trackEvent("report_csv", { state }); downloadCsv(`agrismart-${state.toLowerCase().replace(/\s+/g, "-")}.csv`, csvRows); }}><FileDown size={16} /> {t("common.downloadCsv")}</button>
      </div>} />

      <div className="tools-toolbar no-print">
        <label className="field-label"><span>{t("common.state")}</span><select value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field-label"><span>{lang === "hi" ? "तुलना करें" : "Compare with"}</span><select value={compare} onChange={(e) => setCompare(e.target.value)}>{STATES.filter((x) => x !== state).map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field-label"><span>{lang === "hi" ? "से वर्ष" : "From year"}</span><select value={from} onChange={(e) => setFrom(Number(e.target.value))}>{[1997, 2000, 2005, 2010, 2015].map((y) => <option key={y}>{y}</option>)}</select></label>
      </div>

      <section className="tool-card report-summary">
        <h2>{state} — {lang === "hi" ? "कृषि उत्पादन रिपोर्ट" : "agricultural production report"}</h2>
        <p className="muted">{first?.year}–{last?.year} · generated {new Date().toLocaleDateString("en-IN")} · source: bundled Indian crop-yield dataset ({analytics.rows.toLocaleString("en-IN")} records)</p>
        <div className="result-tiles four">
          <div className="rt green"><small>Production {last?.year}</small><b>{compact(last?.production ?? 0)} <em>t</em></b></div>
          <div className="rt blue"><small>Area {last?.year}</small><b>{compact(last?.area ?? 0)} <em>ha</em></b></div>
          <div className="rt amber"><small>Production change</small><b>{growth > 0 ? "+" : ""}{growth}<em>%</em></b><span>since {first?.year}</span></div>
          <div className="rt violet"><small>Leading crop</small><b className="sm">{top[0]?.crop}</b><span>{top[0]?.yield} t/ha</span></div>
        </div>
      </section>

      <div className="tool-columns">
        <section className="tool-card">
          <h2>Production (t)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={years} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="year" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} tickFormatter={compact} />
              <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" t" />} />
              <Bar dataKey="production" name="Production" fill={c.series[2]} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="tool-card">
          <h2>Average yield: {state} vs {compare} (t/ha)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={yieldCompare} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="year" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip content={<ChartTooltip unit=" t/ha" />} />
              <Line type="monotone" dataKey={state} name={state} stroke={c.series[0]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls />
              <Line type="monotone" dataKey={compare} name={compare} stroke={c.series[1]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div className="legend-inline"><span><i style={{ background: c.series[0] }} />{state}</span><span><i style={{ background: c.series[1] }} />{compare}</span></div>
          <p className="muted tiny">All-crop average mixes crops with very different yields (e.g. sugarcane, coconut); compare crop-wise for decisions.</p>
        </section>
      </div>

      <section className="tool-card">
        <h2>Top crops by area (average of last 3 years)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={top} layout="vertical" margin={{ top: 0, right: 70, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="crop" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} width={120} />
            <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip format={(v) => `${compact(v)}`} unit=" ha" />} />
            <Bar dataKey="area" name="Area" radius={[0, 4, 4, 0]} barSize={16} label={{ position: "right", fill: c.text, fontSize: 11, formatter: compact }}>{top.map((r, i) => <Cell key={r.crop} fill={i < 8 ? c.series[i] : "#9fb3a8"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="tool-card">
        <h2>Data table</h2>
        <div className="table-responsive">
          <table className="table table-sm data-table">
            <thead><tr>{csvRows[0].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{years.map((r) => <tr key={r.year}><td>{r.year}</td><td>{r.area.toLocaleString("en-IN")}</td><td>{r.production.toLocaleString("en-IN")}</td><td>{r.yield}</td><td>{r.rain}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <p className="disclaimer">Historical records (1997–2020) for context. Official, current statistics: Directorate of Economics & Statistics, Ministry of Agriculture (data.gov.in).</p>
    </div>
  );
}
