// Chart kit following the dataviz mark specs: 2px lines, <=24px bars with 4px
// rounded data-ends, 2px surface rings on markers, hairline solid grid, text in
// ink tokens (never the series colour), legend for >= 2 series, a crosshair /
// per-mark tooltip on every chart, and a table view on every ChartCard.
import { useId, useState } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { cx, Card, Segmented } from "@/components/ui/primitives.jsx";
import { fmtNumber } from "@/lib/format.js";

import { useChartColors } from "./useChartColors.js";

const AXIS_TICK = { fontSize: 12 };

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Legend">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5 text-[13px] text-ink-2">
          <span
            aria-hidden
            className={cx("inline-block", it.shape === "line" ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-sm")}
            style={{ background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export function TooltipBox({ title, rows }) {
  return (
    <div className="min-w-36 rounded-xl border border-outline bg-surface px-3 py-2 shadow-card">
      {title != null && <p className="mb-1 text-xs font-medium text-ink-2">{title}</p>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 text-[13px]">
          <span className="flex items-center gap-1.5 text-ink-2">
            {r.color && <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-medium tabular-nums text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function rechartsTooltip(series, colors, format, labelFormat) {
  return function ChartTip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const rows = series
      .map((s, i) => {
        const p = payload.find((x) => x.dataKey === s.key);
        if (!p || p.value == null) return null;
        return { label: s.label, value: (s.format ?? format)(p.value), color: colors.series[s.slot ?? i] };
      })
      .filter(Boolean);
    return <TooltipBox title={labelFormat ? labelFormat(label) : label} rows={rows} />;
  };
}

/**
 * Card with a chart/table toggle. `table` = { columns: [{key,label,format}], rows }.
 */
export function ChartCard({ title, subtitle, icon, legend, actions, table, children, className = "" }) {
  const [view, setView] = useState("chart");
  const toggle = table && (
    <Segmented
      label={`${title} view`}
      value={view}
      onChange={setView}
      options={[{ value: "chart", label: "Chart", icon: "bar_chart" }, { value: "table", label: "Table", icon: "table_chart" }]}
    />
  );
  return (
    <Card title={title} subtitle={subtitle} icon={icon} className={className} actions={<>{actions}{toggle}</>}>
      {legend && view === "chart" && <div className="mb-3"><Legend items={legend} /></div>}
      {view === "chart" || !table ? children : <DataTable {...table} />}
    </Card>
  );
}

export function DataTable({ columns, rows, maxHeight = 320 }) {
  return (
    <div className="overflow-auto rounded-xl border border-outline" style={{ maxHeight }}>
      <table className="w-full border-collapse text-left text-[13px]">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx("px-3 py-2 font-medium text-ink-2", c.align === "right" && "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="border-t border-outline/70">
              {columns.map((c) => (
                <td key={c.key} className={cx("px-3 py-2 text-ink", c.align === "right" && "text-right tabular-nums")}>
                  {c.format ? c.format(r[c.key], r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Line chart (one y-axis). series: [{ key, label, slot? }]. Area wash optional for a single series. */
export function TrendChart({ data, xKey, series, height = 260, yFormat = (v) => fmtNumber(v), xFormat, area = false, endLabel = true }) {
  const c = useChartColors();
  const gradientId = useId().replace(/:/g, "");
  const Chart = area ? ComposedChart : LineChart;
  const last = data.length - 1;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: endLabel ? 56 : 12, bottom: 0, left: 0 }}>
          {area && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.series[series[0].slot ?? 0]} stopOpacity={0.14} />
                <stop offset="100%" stopColor={c.series[series[0].slot ?? 0]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
          )}
          <CartesianGrid vertical={false} stroke={c.grid} strokeWidth={1} />
          <XAxis dataKey={xKey} tick={{ ...AXIS_TICK, fill: c["ink-3"] }} tickLine={false} axisLine={{ stroke: c.outline }}
            tickFormatter={xFormat} minTickGap={24} />
          <YAxis tick={{ ...AXIS_TICK, fill: c["ink-3"] }} tickLine={false} axisLine={false} tickFormatter={yFormat} width={52} />
          <Tooltip content={rechartsTooltip(series, c, yFormat, xFormat)} cursor={{ stroke: c["ink-3"], strokeWidth: 1 }} />
          {area && (
            <Area type="monotone" dataKey={series[0].key} stroke="none" fill={`url(#${gradientId})`} isAnimationActive={false}
              tooltipType="none" activeDot={false} />
          )}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={c.series[s.slot ?? i]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: c.surface, fill: c.series[s.slot ?? i] }}
              isAnimationActive={false}
              connectNulls
            >
              {endLabel && (
                <LabelList
                  dataKey={s.key}
                  content={({ x, y, value, index }) =>
                    index === last && value != null ? (
                      <g>
                        <circle cx={x} cy={y} r={4} fill={c.series[s.slot ?? i]} stroke={c.surface} strokeWidth={2} />
                        <text x={x + 9} y={y + 4} fontSize={12} fill={c.ink} fontWeight={500}>{yFormat(value)}</text>
                      </g>
                    ) : null}
                />
              )}
            </Line>
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical columns from one baseline: <=24px, 4px rounded data-end, value on the cap optional. */
export function ColumnChart({ data, xKey, series, height = 220, yFormat = (v) => fmtNumber(v), xFormat, capLabels = false }) {
  const c = useChartColors();
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: capLabels ? 18 : 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="20%" barGap={2}>
          <CartesianGrid vertical={false} stroke={c.grid} strokeWidth={1} />
          <XAxis dataKey={xKey} tick={{ ...AXIS_TICK, fill: c["ink-3"] }} tickLine={false} axisLine={{ stroke: c.outline }}
            tickFormatter={xFormat} minTickGap={12} />
          <YAxis tick={{ ...AXIS_TICK, fill: c["ink-3"] }} tickLine={false} axisLine={false} tickFormatter={yFormat} width={52} />
          <Tooltip content={rechartsTooltip(series, c, yFormat, xFormat)} cursor={{ fill: c["surface-2"] }} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={c.series[s.slot ?? i]} radius={[4, 4, 0, 0]} maxBarSize={24}
              isAnimationActive={false}>
              {capLabels && <LabelList dataKey={s.key} position="top" formatter={yFormat} style={{ fontSize: 11, fill: c["ink-2"] }} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny trend line for stat tiles (de-emphasis hue, current point in the accent). */
export function Sparkline({ values, height = 36, accent }) {
  const c = useChartColors();
  const data = values.map((v, i) => ({ i, v }));
  if (data.length < 2) return <div style={{ height }} />;
  return (
    <div style={{ height }} className="w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 6, bottom: 4, left: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="v" stroke={c["ink-3"]} strokeWidth={1.5} isAnimationActive={false}
            dot={(p) => (p.index === data.length - 1
              ? <circle key="end" cx={p.cx} cy={p.cy} r={3.5} fill={accent ?? c.primary} stroke={c.surface} strokeWidth={2} />
              : <g key={p.index} />)} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Ranked horizontal bars in HTML (crisper labels than SVG for long names).
 * items: [{ label, value, detail? }]. One series -> one hue; value at the bar tip.
 */
export function BarList({ items, format = (v) => fmtNumber(v), max, slot = 0, highlight }) {
  const c = useChartColors();
  const [hover, setHover] = useState(null);
  const top = max ?? Math.max(...items.map((i) => i.value), 0) ?? 1;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => {
        const pct = top > 0 ? Math.max(0, (it.value / top) * 100) : 0;
        const active = hover === it.label;
        return (
          <li
            key={it.label}
            className="relative grid grid-cols-[minmax(6rem,11rem)_1fr] items-center gap-3"
            onMouseEnter={() => setHover(it.label)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(it.label)}
            onBlur={() => setHover(null)}
            tabIndex={it.detail ? 0 : undefined}
          >
            <span className={cx("truncate text-[13px]", highlight === it.label ? "font-medium text-ink" : "text-ink-2")} title={it.label}>
              {it.label}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-5 min-w-0 flex-1">
                <div
                  className="h-full rounded-r-[4px] transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: c.series[slot], opacity: hover && !active ? 0.55 : 1, minWidth: it.value > 0 ? 2 : 0 }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-[13px] font-medium tabular-nums text-ink">{format(it.value)}</span>
            </div>
            {active && it.detail && (
              <div className="pointer-events-none absolute right-0 bottom-full z-10 mb-1">
                <TooltipBox title={it.label} rows={it.detail} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Diverging bars around a zero line (SHAP contributions): positive pole = blue,
 * negative pole = red, the zero line in neutral grey.
 */
export function DivergingBars({ items, format, posLabel = "Raises", negLabel = "Lowers" }) {
  const c = useChartColors();
  const [hover, setHover] = useState(null);
  const extent = Math.max(...items.map((i) => Math.abs(i.value)), 1e-9);
  return (
    <div className="flex flex-col gap-3">
      <Legend items={[{ label: posLabel, color: c["diverge-pos"] }, { label: negLabel, color: c["diverge-neg"] }]} />
      <ul className="flex flex-col gap-2">
        {items.map((it) => {
          const pct = (Math.abs(it.value) / extent) * 50;
          const pos = it.value >= 0;
          return (
            <li
              key={it.label}
              tabIndex={0}
              className="relative grid grid-cols-[minmax(6.5rem,9.5rem)_1fr] items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onMouseEnter={() => setHover(it.label)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(it.label)}
              onBlur={() => setHover(null)}
            >
              <span className="truncate text-[13px] text-ink-2" title={it.label}>{it.label}</span>
              <div className="relative h-6">
                <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: c["ink-3"] }} aria-hidden />
                <div
                  className={cx("absolute top-1/2 h-4 -translate-y-1/2", pos ? "rounded-r-[4px]" : "rounded-l-[4px]")}
                  style={{
                    background: pos ? c["diverge-pos"] : c["diverge-neg"],
                    left: pos ? "50%" : `${50 - pct}%`,
                    width: `max(${pct}%, 2px)`,
                    opacity: hover && hover !== it.label ? 0.55 : 1,
                  }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums whitespace-nowrap text-ink"
                  style={pos ? { left: `calc(${50 + pct}% + 6px)` } : { right: `calc(${50 + pct}% + 6px)` }}
                >
                  {format(it.value)}
                </span>
              </div>
              {hover === it.label && it.detail && (
                <div className="pointer-events-none absolute right-0 bottom-full z-10 mb-1">
                  <TooltipBox title={it.label} rows={it.detail} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Segmented bar: one whole split into labelled parts (e.g. response classes). */
export function SegmentedBar({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return <div className="h-3 rounded-full bg-surface-2" />;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} title={`${p.label}: ${fmtNumber(p.value)}`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <Legend items={parts.map((p) => ({ label: `${p.label} · ${fmtNumber(p.value)}`, color: p.color }))} />
    </div>
  );
}
