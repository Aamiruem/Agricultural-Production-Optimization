import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import {
  ChartCard,
  CorrelationHeatmap,
  GroupedBars,
  Histogram,
  RankBar,
  ScatterPlot,
  ShareDonut,
  TrendChart,
} from "@/components/data/DataCharts";
import { IconBadge } from "@/components/common/IconBadge";
import { MIcon } from "@/components/common/MIcon";
import { PageHeader } from "@/components/common/PageHeader";
import { useT } from "@/i18n/useT";
import { compact } from "@/lib/chartTheme";
import {
  ROLE_LABELS,
  applyFilters,
  modeLabel,
  buildDataset,
  correlationMatrix,
  countDuplicates,
  detectRoles,
  formatValue,
  generateInsights,
  groupBy,
  histogram,
  metricMode,
  parseFile,
  parseText,
  pearson,
  profileColumns,
  summary,
  timeSeries,
} from "@/lib/dataEngine";
import { G } from "@/lib/icons";
import { trackEvent } from "@/lib/analytics";
import { useDataStore } from "@/store/dataStore";

const SAMPLES = [
  {
    file: "india-crop-yield-sample.csv",
    title: "India crop yield",
    hi: "भारत फसल उपज",
    text: "3,300 state records · crop, season, year, area, production, yield, rainfall",
    icon: "grass",
    color: G.green,
  },
  {
    file: "soil-nutrients-crop.csv",
    title: "Soil nutrients & crops",
    hi: "मिट्टी पोषक तत्व",
    text: "2,200 samples · N, P, K, pH, temperature, humidity, rainfall, crop",
    icon: "science",
    color: G.brown,
  },
  {
    file: "ludhiana-daily-weather.csv",
    title: "Daily weather · Ludhiana",
    hi: "दैनिक मौसम",
    text: "10 years · temperature, rainfall, humidity, evapotranspiration",
    icon: "partly_cloudy_day",
    color: G.blue,
  },
];
const NUMERIC_ROLES = [
  "production",
  "area",
  "yield",
  "rainfall",
  "temperature",
  "humidity",
  "nitrogen",
  "phosphorus",
  "potassium",
  "ph",
  "fertilizer",
  "pesticide",
  "price",
  "revenue",
  "cost",
  "profit",
];
const CATEGORY_ROLES = ["crop", "state", "district", "season", "soil"];
const INSIGHT_ICON = {
  up: ["trending_up", G.green],
  down: ["trending_up", G.red],
  top: ["flag", G.yellow],
  geo: ["map", G.teal],
  season: ["calendar_month", G.blue],
  corr: ["insights", G.purple],
  soil: ["science", G.brown],
  weather: ["rainy", G.cyan],
  warn: ["info", G.orange],
  info: ["info", G.blue],
};
const MAX_BYTES = 50 * 1024 * 1024;

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

export default function DataDashboardPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const { source, table, roleOverrides, setTable, setRole, clear } = useDataStore();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const load = async (getter, src) => {
    setError("");
    setBusy(true);
    try {
      const t = await getter();
      setTable(src, t);
      trackEvent("data_dashboard_load", { kind: src.kind, rows: t.rows.length, cols: t.columns.length });
    } catch (e) {
      setError(e.message || "Could not read this file.");
    } finally {
      setBusy(false);
    }
  };
  const onFile = (file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("File is larger than 50 MB. Filter or aggregate it first.");
      return;
    }
    load(() => parseFile(file), { name: file.name, size: file.size, kind: "file" });
  };
  const onSample = (s) =>
    load(
      async () => {
        const res = await fetch(`/samples/${s.file}`);
        if (!res.ok) throw new Error(`Could not load the sample (${res.status}).`);
        return parseText(await res.text());
      },
      { name: s.file, kind: "sample" },
    );

  return (
    <>
      <PageHeader
        title={hi ? "तुरंत डेटा डैशबोर्ड" : "Instant data dashboard"}
        description={
          hi
            ? "अपनी CSV या Excel फ़ाइल अपलोड करें — फसल, राज्य, मौसम, उपज, वर्षा और N-P-K अपने-आप पहचाने जाते हैं और डैशबोर्ड तुरंत बनता है।"
            : "Upload a CSV or Excel file. Crop, state, season, year, yield, rainfall and N-P-K columns are detected automatically and a dashboard is built instantly."
        }
        icon="query_stats"
        color={G.blue}
        actions={
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            <MIcon name="space_dashboard" size={18} /> {hi ? "भारत अवलोकन" : "India overview"}
          </Link>
        }
      />

      {!table ? (
        <>
          <div
            className={`data-drop${drag ? " drag" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFile(e.dataTransfer.files?.[0]);
            }}
          >
            <IconBadge icon="upload_file" color={G.blue} box={72} size={38} />
            <b>
              {busy
                ? hi
                  ? "पढ़ रहे हैं…"
                  : "Reading your data…"
                : hi
                  ? "फ़ाइल यहाँ छोड़ें या चुनें"
                  : "Drop a file here or click to choose"}
            </b>
            <small>
              CSV · TSV · Excel (.xlsx) · JSON — up to 50 MB ·{" "}
              {hi ? "डेटा आपके डिवाइस पर ही रहता है" : "data never leaves your device"}
            </small>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".csv,.tsv,.txt,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {error && (
            <p className="field-error mt-2" role="alert">
              {error}
            </p>
          )}
          <h2 className="h5 mt-4 mb-3">{hi ? "या नमूना डेटा आज़माएँ" : "Or try a sample dataset"}</h2>
          <div className="sample-grid">
            {SAMPLES.map((s) => (
              <button key={s.file} type="button" className="sample-card" onClick={() => onSample(s)} disabled={busy}>
                <IconBadge icon={s.icon} color={s.color} />
                <span>
                  <b>{hi ? s.hi : s.title}</b>
                  <small>{s.text}</small>
                </span>
                <MIcon name="arrow_forward" size={20} />
              </button>
            ))}
          </div>
          <div className="how-grid">
            {[
              [
                "table_chart",
                G.green,
                "Detects columns",
                "Numbers, years, dates and categories; crop, state, season, area, production, yield, rainfall, N-P-K, price…",
              ],
              [
                "insights",
                G.purple,
                "Finds insights",
                "Growth trends, leading crops and states, strongest yield drivers, outliers and missing data.",
              ],
              [
                "filter_alt",
                G.orange,
                "Interactive",
                "Filter by crop, state, season and year; change the metric; fix any column role.",
              ],
              ["download", G.blue, "Export", "Download the filtered data as CSV or print the dashboard to PDF."],
            ].map(([icon, color, t, d]) => (
              <div key={t} className="how-card">
                <IconBadge icon={icon} color={color} />
                <b>{t}</b>
                <small>{d}</small>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Dashboard table={table} source={source} overrides={roleOverrides} setRole={setRole} onReset={clear} hi={hi} />
      )}
    </>
  );
}

function Dashboard({ table, source, overrides, setRole, onReset, hi }) {
  const profiles = useMemo(() => profileColumns(table.columns, table.rows), [table]);
  const detected = useMemo(() => detectRoles(profiles), [profiles]);
  const roles = useMemo(() => {
    const r = { ...detected };
    for (const [role, col] of Object.entries(overrides)) {
      if (col) r[role] = col;
      else delete r[role];
    }
    return r;
  }, [detected, overrides]);
  const ds = useMemo(() => buildDataset(table.rows, profiles, roles), [table, profiles, roles]);
  const filterCols = [ds.roles.crop, ds.roles.state, ds.roles.season, ds.roles.district].filter(Boolean).slice(0, 3);
  if (!filterCols.length)
    filterCols.push(...ds.categories.filter((c) => profiles.find((p) => p.name === c)?.distinct <= 60).slice(0, 2));
  const years = useMemo(
    () =>
      ds.roles.year
        ? [...new Set(ds.records.map((r) => r[ds.roles.year]).filter((y) => y != null))].sort((a, b) => a - b)
        : [],
    [ds],
  );
  const [cat, setCat] = useState({});
  const [yr, setYr] = useState(null);
  const defaultMetric = ds.roles.production ?? ds.roles.yield ?? ds.roles.rainfall ?? ds.numeric[0];
  const [metricSel, setMetricSel] = useState(null);
  const metric = ds.numeric.includes(metricSel) ? metricSel : defaultMetric;
  const [showCols, setShowCols] = useState(false);
  const yearRange = useMemo(() => yr ?? (years.length ? [years[0], years.at(-1)] : null), [yr, years]);
  const rows = useMemo(() => applyFilters(ds.records, { categories: cat, yearRange }, ds.roles), [ds, cat, yearRange]);

  const view = useMemo(() => {
    const R = ds.roles;
    const ts = metric ? timeSeries(rows, metric, R) : null;
    const rank = (col, m = metric, limit = 10) => {
      const g = groupBy(rows, col, m, R);
      return { mode: g.mode, data: g.data.sort((x, y) => y.value - x.value).slice(0, limit) };
    };
    // Shares only make sense for additive metrics; otherwise share of rows.
    const share = (col) => {
      if (!col) return null;
      const additive = metric && metricMode(metric, R) === "sum";
      const g = groupBy(rows, col, additive ? metric : undefined, R, additive ? {} : { mode: "count" });
      const sorted = g.data.sort((x, y) => y.value - x.value);
      if (sorted.length < 2 || sorted.length > 40) return null;
      const top = sorted.slice(0, 6);
      const rest = sorted.slice(6).reduce((t, d) => t + d.value, 0);
      return { mode: g.mode, data: rest > 0 ? [...top, { key: "Other", value: rest }] : top };
    };
    // Scatter: rainfall→yield if present, else the strongest correlated numeric pair.
    let pair = R.yield && R.rainfall ? [R.rainfall, R.yield] : null;
    const numCols = ds.numeric
      .filter((c) => profiles.find((p) => p.name === c)?.stats || c === "Yield (derived)")
      .slice(0, 8);
    const matrix = numCols.length >= 3 ? correlationMatrix(rows, numCols) : null;
    if (!pair && matrix) {
      let best = null;
      matrix.forEach((row, i) =>
        row.forEach((v, j) => {
          if (j > i && v != null && (!best || Math.abs(v) > Math.abs(best.v)))
            best = { v, a: numCols[i], b: numCols[j] };
        }),
      );
      if (best) pair = [best.a, best.b];
    }
    const step = Math.max(1, Math.ceil(rows.length / 1500));
    const points = pair
      ? rows
          .filter((_, i) => i % step === 0)
          .filter((r) => r[pair[0]] != null && r[pair[1]] != null)
          .map((r) => ({ x: r[pair[0]], y: r[pair[1]], label: R.crop ? r[R.crop] : undefined }))
      : [];
    const r = pair
      ? pearson(
          rows.map((x) => x[pair[0]]),
          rows.map((x) => x[pair[1]]),
        )
      : null;
    // N-P-K by crop
    let npk = null;
    if (R.nitrogen && R.phosphorus && R.potassium && R.crop) {
      const by = (m) =>
        Object.fromEntries(groupBy(rows, R.crop, m, R, { mode: "mean" }).data.map((d) => [d.key, d.value]));
      const [n, p, k] = [by(R.nitrogen), by(R.phosphorus), by(R.potassium)];
      npk = Object.keys(n)
        .map((key) => ({ key, N: n[key], P: p[key], K: k[key] }))
        .sort((a, b) => b.N + b.P + b.K - (a.N + a.P + a.K))
        .slice(0, 8);
    }
    const secondCat =
      !R.crop && !R.state ? ds.categories.find((c) => profiles.find((p) => p.name === c)?.distinct <= 60) : null;
    return {
      ts,
      pair,
      points,
      r,
      npk,
      matrix,
      numCols,
      byCrop: R.crop ? rank(R.crop) : null,
      byState: R.state ? rank(R.state) : null,
      yieldByCrop: R.yield && R.crop && R.yield !== metric ? rank(R.crop, R.yield) : null,
      byDistrict: R.district ? rank(R.district) : null,
      byGeneric: secondCat ? rank(secondCat) : null,
      secondCat,
      season: share(R.season ?? (R.crop ? null : secondCat)),
      seasonCol: R.season ?? secondCat,
      hist: metric ? histogram(rows.map((x) => x[metric])) : [],
    };
  }, [rows, ds, metric, profiles]);

  const insights = useMemo(() => generateInsights(ds, rows, profiles, metric), [ds, rows, profiles, metric]);
  const kpis = useMemo(() => buildKpis(ds, rows), [ds, rows]);
  const dup = useMemo(() => countDuplicates(table.rows, table.columns), [table]);
  const types = useMemo(() => Object.fromEntries(profiles.map((p) => [p.name, p.type])), [profiles]);
  const roleOf = (col) => Object.entries(ds.roles).find(([, c]) => c === col)?.[0] ?? "";
  const metricName = metric ? `${metric} (${modeLabel(view.ts?.mode ?? "mean")})` : "";

  const exportCsv = () => {
    const cols = [...table.columns, ...(ds.derived.includes("yield") ? ["Yield (derived)"] : [])];
    const cell = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : (v ?? ""));
    download(
      `agrismart-${(source?.name ?? "data").replace(/\.[^.]+$/, "")}-filtered.csv`,
      [
        cols.join(","),
        ...rows.map((r) => cols.map((c) => `"${String(cell(r[c])).replace(/"/g, '""')}"`).join(",")),
      ].join("\n"),
    );
  };

  return (
    <div className="data-dash">
      <div className="dataset-bar">
        <IconBadge icon="table_chart" color={G.green} />
        <div className="dataset-meta">
          <b>{source?.name}</b>
          <small>
            {table.rows.length.toLocaleString("en-IN")} rows · {table.columns.length} columns
            {table.truncated
              ? ` · first ${table.rows.length.toLocaleString("en-IN")} of ${table.totalRows.toLocaleString("en-IN")} rows loaded`
              : ""}
            {rows.length !== ds.records.length ? ` · ${rows.length.toLocaleString("en-IN")} after filters` : ""}
          </small>
          <div className="role-chips">
            {Object.entries(ds.roles).map(([role, col]) => (
              <span key={role} className="chip small on" title={col}>
                {ROLE_LABELS[role]}: {col}
              </span>
            ))}
          </div>
        </div>
        <div className="dataset-actions no-print">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowCols((v) => !v)}
            aria-expanded={showCols}
          >
            <MIcon name="table_chart" size={18} /> {hi ? "कॉलम" : "Columns"}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}>
            <MIcon name="download" size={18} /> CSV
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
            <MIcon name="download" size={18} /> PDF
          </button>
          <button type="button" className="btn btn-tonal btn-sm" onClick={onReset}>
            <MIcon name="upload_file" size={18} /> {hi ? "नई फ़ाइल" : "New file"}
          </button>
        </div>
      </div>

      {showCols && (
        <section className="tool-card no-print">
          <h2>{hi ? "कॉलम और भूमिकाएँ" : "Columns & roles"}</h2>
          <p className="muted small">
            Roles are detected from column names and values. Change a role if it is wrong; the dashboard updates
            instantly.
          </p>
          <div className="table-responsive">
            <table className="table table-sm data-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Role</th>
                  <th>Missing</th>
                  <th>Distinct</th>
                  <th>Range / top value</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const current = roleOf(p.name);
                  const options =
                    p.type === "numeric"
                      ? NUMERIC_ROLES
                      : p.type === "category"
                        ? CATEGORY_ROLES
                        : p.type === "year"
                          ? ["year"]
                          : p.type === "date"
                            ? ["date"]
                            : [];
                  return (
                    <tr key={p.name}>
                      <td>
                        <b>{p.name}</b>
                      </td>
                      <td>
                        <span className={`type-tag t-${p.type}`}>{p.type}</span>
                      </td>
                      <td>
                        <select
                          aria-label={`Role for ${p.name}`}
                          className="role-select"
                          value={current}
                          disabled={!options.length}
                          onChange={(e) => {
                            if (current) setRole(current, "");
                            if (e.target.value) setRole(e.target.value, p.name);
                          }}
                        >
                          <option value="">—</option>
                          {options.map((o) => (
                            <option key={o} value={o}>
                              {ROLE_LABELS[o]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={p.missing > 0.05 ? "text-warning" : ""}>{(p.missing * 100).toFixed(1)}%</td>
                      <td>{p.distinct.toLocaleString("en-IN")}</td>
                      <td className="muted">
                        {p.stats
                          ? `${formatValue(p.stats.min)} – ${formatValue(p.stats.max)} (median ${formatValue(p.stats.median)})`
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="data-filters no-print">
        {filterCols.map((col) => {
          const opts = [...new Set(ds.records.map((r) => r[col]).filter(Boolean))].sort();
          return (
            <label key={col} className="field-label">
              <span>
                <MIcon name="filter_alt" size={16} /> {col}
              </span>
              <select value={cat[col] ?? ""} onChange={(e) => setCat((c) => ({ ...c, [col]: e.target.value }))}>
                <option value="">All ({opts.length})</option>
                {opts.slice(0, 500).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          );
        })}
        {years.length > 1 && yearRange && (
          <div className="field-label" role="group" aria-label="Year range">
            <span>
              <MIcon name="calendar_month" size={16} /> {ds.roles.year}
            </span>
            <div className="year-range">
              <select
                aria-label="From year"
                value={yearRange[0]}
                onChange={(e) => setYr([Number(e.target.value), Math.max(Number(e.target.value), yearRange[1])])}
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              <span>–</span>
              <select
                aria-label="To year"
                value={yearRange[1]}
                onChange={(e) => setYr([Math.min(yearRange[0], Number(e.target.value)), Number(e.target.value)])}
              >
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {ds.numeric.length > 0 && (
          <label className="field-label">
            <span>
              <MIcon name="monitoring" size={16} /> {hi ? "मीट्रिक" : "Metric"}
            </span>
            <select value={metric ?? ""} onChange={(e) => setMetricSel(e.target.value)}>
              {ds.numeric.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {(Object.values(cat).some(Boolean) || yr) && (
          <button
            type="button"
            className="btn btn-text btn-sm"
            onClick={() => {
              setCat({});
              setYr(null);
            }}
          >
            {hi ? "फ़िल्टर हटाएँ" : "Clear filters"}
          </button>
        )}
      </div>

      <div className="data-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="g-card kpi">
            <IconBadge icon={k.icon} color={k.color} />
            <span className="kpi-label">{k.label}</span>
            <b className="kpi-value">{k.value}</b>
            {k.note && <small>{k.note}</small>}
          </div>
        ))}
      </div>

      <section className="g-card insights-card">
        <div className="card-head2">
          <div>
            <h3>
              <MIcon name="auto_awesome" size={20} fill /> {hi ? "मुख्य निष्कर्ष" : "Key insights"}
            </h3>
            <p>
              {hi ? "आपके डेटा से अपने-आप" : "Generated from your data"} · {rows.length.toLocaleString("en-IN")} rows
            </p>
          </div>
        </div>
        <ul className="insight-list">
          {insights.map((ins) => {
            const [icon, color] = INSIGHT_ICON[ins.kind] ?? INSIGHT_ICON.info;
            return (
              <li key={ins.text}>
                <IconBadge icon={icon} color={color} size={18} className="sm" />
                <span>{ins.text}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="dash-grid data-grid">
        {view.ts && view.ts.data.length > 1 && (
          <ChartCard span={8} title={`${metric} over time`} subtitle={`${modeLabel(view.ts.mode)} by ${view.ts.unit}`}>
            <TrendChart data={view.ts.data} name={metricName} />
          </ChartCard>
        )}
        {view.season && (
          <ChartCard
            span={4}
            title={`Share by ${view.seasonCol}`}
            subtitle={view.season.mode === "count" ? "rows" : `${metric} (total)`}
          >
            <ShareDonut data={view.season.data} />
          </ChartCard>
        )}
        {view.byCrop && view.byCrop.data.length > 1 && (
          <ChartCard span={6} title={`Top crops · ${metric}`} subtitle={modeLabel(view.byCrop.mode)}>
            <RankBar data={view.byCrop.data} name={metric} />
          </ChartCard>
        )}
        {view.byState && view.byState.data.length > 1 && (
          <ChartCard span={6} title={`By state · ${metric}`} subtitle={modeLabel(view.byState.mode)}>
            <RankBar data={view.byState.data} name={metric} colorIndex={2} />
          </ChartCard>
        )}
        {view.byDistrict && view.byDistrict.data.length > 1 && (
          <ChartCard span={6} title={`By district · ${metric}`} subtitle={modeLabel(view.byDistrict.mode)}>
            <RankBar data={view.byDistrict.data} name={metric} colorIndex={6} />
          </ChartCard>
        )}
        {view.yieldByCrop && view.yieldByCrop.data.length > 1 && (
          <ChartCard span={6} title={`Yield by crop · ${ds.roles.yield}`} subtitle={modeLabel(view.yieldByCrop.mode)}>
            <RankBar data={view.yieldByCrop.data} name={ds.roles.yield} colorIndex={3} />
          </ChartCard>
        )}
        {view.byGeneric && view.byGeneric.data.length > 1 && (
          <ChartCard span={6} title={`By ${view.secondCat} · ${metric}`} subtitle={modeLabel(view.byGeneric.mode)}>
            <RankBar data={view.byGeneric.data} name={metric} />
          </ChartCard>
        )}
        {view.npk && view.npk.length > 1 && (
          <ChartCard span={6} title="Soil nutrient profile by crop" subtitle="average N, P and K">
            <GroupedBars
              data={view.npk}
              series={[
                { key: "N", label: "Nitrogen" },
                { key: "P", label: "Phosphorus" },
                { key: "K", label: "Potassium" },
              ]}
            />
          </ChartCard>
        )}
        {view.pair && view.points.length > 5 && (
          <ChartCard
            span={6}
            title={`${view.pair[1]} vs ${view.pair[0]}`}
            subtitle={
              view.r != null ? `r = ${view.r.toFixed(2)} · ${view.points.length.toLocaleString("en-IN")} points` : ""
            }
            note="Each dot is a row (sampled above 1,500). Correlation shows association, not cause."
          >
            <ScatterPlot points={view.points} x={view.pair[0]} y={view.pair[1]} />
          </ChartCard>
        )}
        {view.hist.length > 2 && (
          <ChartCard span={6} title={`Distribution of ${metric}`} subtitle="rows per range (extreme outliers clipped)">
            <Histogram data={view.hist} name={metric} />
          </ChartCard>
        )}
        {view.matrix && (
          <ChartCard
            span={12}
            title="Correlation matrix"
            subtitle="Pearson r between numeric columns · green = rise together · blue = move opposite"
          >
            <CorrelationHeatmap cols={view.numCols} matrix={view.matrix} />
          </ChartCard>
        )}
      </div>

      <div className="tool-columns mt-3">
        <section className="tool-card">
          <h2>
            <MIcon name="verified_user" size={20} fill /> {hi ? "डेटा गुणवत्ता" : "Data quality"}
          </h2>
          <div className="quality-stats">
            <span>
              <b>{dup.toLocaleString("en-IN")}</b>
              <small>duplicate rows</small>
            </span>
            <span>
              <b>{profiles.filter((p) => p.missing > 0).length}</b>
              <small>columns with gaps</small>
            </span>
            <span>
              <b>{profiles.reduce((s, p) => s + (p.stats?.outliers ?? 0), 0).toLocaleString("en-IN")}</b>
              <small>outlier values</small>
            </span>
          </div>
          <ul className="missing-list">
            {profiles.slice(0, 14).map((p) => (
              <li key={p.name}>
                <span title={p.name}>{p.name}</span>
                <i>
                  <em style={{ width: `${(1 - p.missing) * 100}%` }} />
                </i>
                <small>{((1 - p.missing) * 100).toFixed(0)}% filled</small>
              </li>
            ))}
          </ul>
        </section>
        <section className="tool-card">
          <h2>
            <MIcon name="table_chart" size={20} /> {hi ? "डेटा पूर्वावलोकन" : "Data preview"}
          </h2>
          <div className="table-responsive preview-table">
            <table className="table table-sm data-table">
              <thead>
                <tr>
                  {table.columns.slice(0, 8).map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 12).map((r, i) => (
                  <tr key={i}>
                    {table.columns.slice(0, 8).map((c) => (
                      <td key={c}>
                        {r[c] instanceof Date
                          ? r[c].toISOString().slice(0, 10)
                          : typeof r[c] === "number"
                            ? types[c] === "year"
                              ? r[c]
                              : formatValue(r[c])
                            : (r[c] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.columns.length > 8 && (
            <p className="muted tiny mb-0">Showing 8 of {table.columns.length} columns · export CSV for everything.</p>
          )}
        </section>
      </div>
      <p className="disclaimer">
        Automatic analysis assumes consistent units within each column. Check the detected roles, and confirm decisions
        with local agronomy advice.
      </p>
    </div>
  );
}

function buildKpis(ds, rows) {
  const R = ds.roles;
  const k = [{ label: "Records", value: rows.length.toLocaleString("en-IN"), icon: "table_chart", color: G.blue }];
  const sum = (c) => rows.reduce((s, r) => s + (r[c] ?? 0), 0);
  if (R.production)
    k.push({ label: `Total ${R.production}`, value: compact(sum(R.production)), icon: "grass", color: G.green });
  if (R.area) k.push({ label: `Total ${R.area}`, value: compact(sum(R.area)), icon: "landscape", color: G.teal });
  if (R.yield) {
    const w =
      R.production && R.area
        ? sum(R.production) / Math.max(sum(R.area), 1e-9)
        : summary(rows.map((r) => r[R.yield]))?.mean;
    if (w != null)
      k.push({
        label: R.production && R.area ? "Weighted yield" : `Average ${R.yield}`,
        value: formatValue(w),
        note: "production ÷ area",
        icon: "trending_up",
        color: G.purple,
      });
  }
  if (R.crop)
    k.push({
      label: "Crops",
      value: new Set(rows.map((r) => r[R.crop]).filter(Boolean)).size,
      icon: "nutrition",
      color: G.red,
    });
  if (R.state)
    k.push({
      label: "States / regions",
      value: new Set(rows.map((r) => r[R.state]).filter(Boolean)).size,
      icon: "map",
      color: G.teal,
    });
  if (R.year) {
    const ys = rows.map((r) => r[R.year]).filter((y) => y != null);
    if (ys.length)
      k.push({
        label: "Years",
        value: `${Math.min(...ys)}–${Math.max(...ys)}`,
        icon: "calendar_month",
        color: G.orange,
      });
  } else if (R.date) {
    const ds2 = rows
      .map((r) => r[R.date])
      .filter(Boolean)
      .map((d) => d.getTime());
    if (ds2.length)
      k.push({
        label: "Date range",
        value: `${new Date(Math.min(...ds2)).getUTCFullYear()}–${new Date(Math.max(...ds2)).getUTCFullYear()}`,
        note: `${ds2.length.toLocaleString("en-IN")} days`,
        icon: "calendar_month",
        color: G.orange,
      });
  }
  for (const role of ["rainfall", "temperature", "ph", "nitrogen"]) {
    if (k.length >= 8) break;
    if (R[role]) {
      const s = summary(rows.map((r) => r[R[role]]));
      if (s)
        k.push({
          label: `Avg ${R[role]}`,
          value: formatValue(s.mean),
          note: `range ${formatValue(s.min)}–${formatValue(s.max)}`,
          icon: role === "rainfall" ? "rainy" : role === "temperature" ? "wb_sunny" : "science",
          color: role === "rainfall" ? G.cyan : role === "temperature" ? G.yellow : G.brown,
        });
    }
  }
  for (const c of ds.numeric) {
    if (k.length >= 4) break;
    if (!Object.values(R).includes(c)) {
      const s = summary(rows.map((r) => r[c]));
      if (s) k.push({ label: `Avg ${c}`, value: formatValue(s.mean), icon: "monitoring", color: G.pink });
    }
  }
  return k.slice(0, 8);
}
