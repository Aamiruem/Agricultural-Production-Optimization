import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { compact, useChartColors } from "@/lib/chartTheme";
import { formatValue } from "@/lib/dataEngine";


export function ChartCard({ title, subtitle, children, span = 6, note }) {
  return (
    <section className={`g-card span-${span} data-chart`}>
      <div className="card-head2"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div></div>
      {children}
      {note && <p className="muted tiny mb-0 mt-2">{note}</p>}
    </section>
  );
}

export function TrendChart({ data, name }) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs><linearGradient id="dataTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.primary} stopOpacity={0.35} /><stop offset="100%" stopColor={c.primary} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="key" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} minTickGap={16} />
        <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} tickFormatter={compact} width={52} />
        <Tooltip content={<ChartTooltip format={formatValue} />} />
        <Area type="monotone" dataKey="value" name={name} stroke={c.primary} strokeWidth={2} fill="url(#dataTrend)" activeDot={{ r: 5, strokeWidth: 2, stroke: c.surface }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RankBar({ data, name, colorIndex = 0, height }) {
  const c = useChartColors();
  const h = height ?? Math.max(160, data.length * 28 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="key" stroke={c.axis} tickLine={false} axisLine={false} fontSize={12} width={120} tickFormatter={(v) => (String(v).length > 16 ? `${String(v).slice(0, 15)}…` : v)} />
        <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip format={formatValue} />} />
        <Bar dataKey="value" name={name} fill={c.series[colorIndex]} radius={[0, 4, 4, 0]} barSize={16} label={{ position: "right", fill: c.text, fontSize: 11, formatter: formatValue }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ShareDonut({ data }) {
  const c = useChartColors();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="donut-row">
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="key" innerRadius={60} outerRadius={92} paddingAngle={1.5} stroke={c.surface} strokeWidth={2}>
              {data.map((d, i) => <Cell key={d.key} fill={d.key === "Other" ? c.muted : c.series[i % 8]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip format={formatValue} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><b>{compact(total)}</b><small>total</small></div>
      </div>
      <ul className="legend-list">{data.map((d, i) => <li key={d.key}><i style={{ background: d.key === "Other" ? c.muted : c.series[i % 8] }} />{d.key}<b>{total ? ((d.value / total) * 100).toFixed(0) : 0}%</b></li>)}</ul>
    </div>
  );
}

export function ScatterPlot({ points, x, y }) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
        <CartesianGrid stroke={c.grid} />
        <XAxis type="number" dataKey="x" name={x} stroke={c.axis} tickLine={false} fontSize={11} tickFormatter={compact} label={{ value: x, position: "insideBottom", offset: -6, fill: c.axis, fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name={y} stroke={c.axis} tickLine={false} fontSize={11} tickFormatter={compact} width={52} />
        <ZAxis range={[28, 28]} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => (active && payload?.length ? (
          <div className="chart-tooltip"><div className="chart-tooltip-row"><span>{x}</span><b>{formatValue(payload[0].payload.x)}</b></div><div className="chart-tooltip-row"><span>{y}</span><b>{formatValue(payload[0].payload.y)}</b></div>{payload[0].payload.label && <div className="chart-tooltip-label mt-1">{payload[0].payload.label}</div>}</div>
        ) : null)} />
        <Scatter data={points} fill={c.series[0]} fillOpacity={0.55} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function GroupedBars({ data, series }) {
  const c = useChartColors();
  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={1} barCategoryGap="22%">
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="key" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-35} textAnchor="end" height={56} tickFormatter={(v) => (String(v).length > 12 ? `${String(v).slice(0, 11)}…` : v)} />
          <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip format={formatValue} />} />
          {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={c.series[i]} radius={[4, 4, 0, 0]} maxBarSize={18} />)}
        </BarChart>
      </ResponsiveContainer>
      <div className="legend-inline">{series.map((s, i) => <span key={s.key}><i style={{ background: c.series[i] }} />{s.label}</span>)}</div>
    </>
  );
}

export function Histogram({ data, name }) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap={1}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="bin" stroke={c.axis} tickLine={false} axisLine={false} fontSize={10} minTickGap={12} />
        <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
        <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip labelPrefix={`${name} ≥ `} />} />
        <Bar dataKey="count" name="Rows" fill={c.series[2]} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Diverging heatmap (blue negative · grey 0 · green positive) with values on every cell. */
export function CorrelationHeatmap({ cols, matrix }) {
  const colour = (r) => {
    if (r == null) return "transparent";
    const a = Math.min(1, Math.abs(r));
    return r >= 0 ? `rgba(24,128,56,${0.08 + a * 0.75})` : `rgba(26,115,232,${0.08 + a * 0.75})`;
  };
  return (
    <div className="table-responsive">
      <table className="heatmap" aria-label="Correlation matrix">
        <thead><tr><th />{cols.map((c) => <th key={c} scope="col" title={c}>{c.length > 10 ? `${c.slice(0, 9)}…` : c}</th>)}</tr></thead>
        <tbody>{cols.map((r, i) => (
          <tr key={r}><th scope="row" title={r}>{r.length > 14 ? `${r.slice(0, 13)}…` : r}</th>
            {matrix[i].map((v, j) => <td key={cols[j]} style={{ background: colour(v), color: v != null && Math.abs(v) > 0.55 ? "#fff" : undefined }} title={`${r} × ${cols[j]}: ${v == null ? "n/a" : v.toFixed(2)}`}>{v == null ? "–" : v.toFixed(2)}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
