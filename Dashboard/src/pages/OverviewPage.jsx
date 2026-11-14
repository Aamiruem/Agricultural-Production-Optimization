import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { ChartCard, ColumnChart, TrendChart } from "@/components/charts/Charts.jsx";
import { useChartColors } from "@/components/charts/useChartColors.js";
import { cx } from "@/lib/cx.js";
import { Button, Card, ErrorState, Icon, Meter, Select, Skeleton, StatusPill } from "@/components/ui/primitives.jsx";
import { StatTile } from "@/components/ui/StatTile.jsx";
import { useAuth } from "@/context/auth.js";
import { useSamples } from "@/hooks/useSamples.js";
import { fmtMs, fmtNumber, fmtPct, titleCase } from "@/lib/format.js";
import { useCoverage, useSystemStatus, useTrend } from "@/lib/queries.js";
import { fetchForecast, LOCATIONS } from "@/lib/weather.js";

const SERVICE_META = {
  api: { label: "FastAPI · AI/ML", icon: "psychology" },
  "farm-service": { label: "Express · Farms", icon: "agriculture" },
  mcp: { label: "MCP server", icon: "hub" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function ServiceMap({ status, isLoading, error, refetch }) {
  if (error && !status) return <ErrorState error={error} onRetry={refetch} compact />;
  return (
    <ul className="flex flex-col divide-y divide-outline/70">
      {(isLoading ? Object.keys(SERVICE_META).map((name) => ({ name })) : status.services).map((s) => {
        const meta = SERVICE_META[s.name] ?? { label: s.name, icon: "dns" };
        return (
          <li key={s.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink-2">
              <Icon name={meta.icon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{meta.label}</p>
              <p className="truncate text-xs text-ink-3">
                {isLoading
                  ? "Checking…"
                  : s.status === "down"
                    ? `Unreachable (${s.error ?? "no response"})`
                    : [fmtMs(s.latency_ms), s.details?.instance ?? s.instance].filter(Boolean).join(" · ")}
              </p>
            </div>
            {isLoading ? <Skeleton className="h-6 w-20" /> : <StatusPill status={s.status} />}
          </li>
        );
      })}
    </ul>
  );
}

function ProductionTrend() {
  const coverage = useCoverage();
  const [state, setState] = useState("Punjab");
  const [crop, setCrop] = useState("Wheat");
  const states = coverage.data?.states ?? [];
  const crops = useMemo(() => {
    const pairs = coverage.data?.state_crops ?? [];
    return pairs
      .filter(([s]) => s === state)
      .map(([, c]) => c)
      .sort();
  }, [coverage.data, state]);
  const activeCrop = crops.includes(crop) ? crop : crops[0];
  const trend = useTrend(state, activeCrop);
  const points = trend.data?.points ?? [];

  return (
    <ChartCard
      className="xl:col-span-2"
      title="Yield trend"
      subtitle={`${activeCrop ?? "…"} in ${state} · tonnes per hectare by crop year (historical records)`}
      icon="trending_up"
      table={{
        columns: [
          { key: "year", label: "Year" },
          { key: "yield_t_ha", label: "Yield (t/ha)", align: "right", format: (v) => v.toFixed(2) },
          { key: "production_t", label: "Production (t)", align: "right", format: (v) => fmtNumber(v) },
          { key: "area_ha", label: "Area (ha)", align: "right", format: (v) => fmtNumber(v) },
        ],
        rows: points,
      }}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="State" value={state} onChange={setState} options={states.length ? states : [state]} />
        <Select label="Crop" value={activeCrop ?? ""} onChange={setCrop} options={crops.length ? crops : [crop]} />
      </div>
      {trend.isLoading || coverage.isLoading ? (
        <Skeleton className="h-65 w-full" />
      ) : trend.error ? (
        <ErrorState error={trend.error} onRetry={trend.refetch} />
      ) : points.length ? (
        <TrendChart
          data={points}
          xKey="year"
          series={[{ key: "yield_t_ha", label: "Yield (t/ha)" }]}
          area
          yFormat={(v) => Number(v).toFixed(1)}
        />
      ) : (
        <p className="py-16 text-center text-sm text-ink-2">No records for this state and crop.</p>
      )}
    </ChartCard>
  );
}

function WeatherPanel() {
  const [loc, setLoc] = useState(LOCATIONS[0].id);
  const location = LOCATIONS.find((l) => l.id === loc);
  const c = useChartColors();
  const q = useQuery({
    queryKey: ["weather", loc],
    queryFn: ({ signal }) => fetchForecast(location, { signal }),
    staleTime: 30 * 60_000,
    retry: 2,
  });
  const days = q.data ?? [];
  const table = {
    columns: [
      { key: "day", label: "Day" },
      { key: "tmin", label: "Min °C", align: "right" },
      { key: "tmax", label: "Max °C", align: "right" },
      { key: "rain", label: "Rain (mm)", align: "right" },
      { key: "et0", label: "ET₀ (mm)", align: "right" },
    ],
    rows: days,
  };
  const waterNeed = days.reduce((s, d) => s + (d.et0 ?? 0) - (d.rain ?? 0), 0);
  return (
    <>
      <ChartCard
        className="xl:col-span-2"
        title="7-day field weather"
        subtitle={`${location.label} · Open-Meteo forecast`}
        icon="partly_cloudy_day"
        legend={[
          { label: "Daily minimum", color: c.series[0], shape: "line" },
          { label: "Daily maximum", color: c.series[1], shape: "line" },
        ]}
        actions={
          <Select
            label="Location"
            value={loc}
            onChange={setLoc}
            options={LOCATIONS.map((l) => ({ value: l.id, label: l.label }))}
          />
        }
        table={table}
      >
        {q.isLoading ? (
          <Skeleton className="h-60 w-full" />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} />
        ) : (
          <TrendChart
            data={days}
            xKey="day"
            height={240}
            yFormat={(v) => `${Math.round(v)}°`}
            series={[
              { key: "tmin", label: "Minimum", slot: 0 },
              { key: "tmax", label: "Maximum", slot: 1 },
            ]}
          />
        )}
      </ChartCard>
      <ChartCard
        title="Water balance"
        subtitle="Rainfall vs crop evapotranspiration (ET₀), mm per day"
        icon="water_drop"
        legend={[
          { label: "Rainfall", color: c.series[0] },
          { label: "ET₀ demand", color: c.series[1] },
        ]}
        table={table}
      >
        {q.isLoading ? (
          <Skeleton className="h-50 w-full" />
        ) : q.error ? (
          <ErrorState error={q.error} compact />
        ) : (
          <>
            <ColumnChart
              data={days}
              xKey="day"
              height={200}
              yFormat={(v) => Number(v).toFixed(1)}
              series={[
                { key: "rain", label: "Rainfall (mm)", slot: 0 },
                { key: "et0", label: "ET₀ (mm)", slot: 1 },
              ]}
            />
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-[13px] text-ink-2">
              <Icon
                name={waterNeed > 5 ? "water_drop" : "check_circle"}
                size={18}
                className={waterNeed > 5 ? "text-warn" : "text-good"}
              />
              {waterNeed > 5
                ? `Net deficit of ${waterNeed.toFixed(0)} mm this week — plan irrigation for water-hungry crops.`
                : "Rainfall covers this week's crop water demand."}
            </p>
          </>
        )}
      </ChartCard>
    </>
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const status = useSystemStatus();
  const s = status.data;
  const samples = useSamples(
    s ? { rps: s.load.requests_per_s_1m, p95: s.load.latency_ms.p95 } : null,
    status.dataUpdatedAt,
  );
  const crop = s?.models.crop;
  const yieldModel = s?.models.yield;
  const healthy = s ? s.services.filter((x) => x.status === "ok").length : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[28px] font-normal text-ink">
            {greeting()}
            {user ? `, ${user.full_name.split(" ")[0]}` : ""}
          </p>
          <p className="mt-1 text-sm text-ink-2">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · live view of models, farms and platform health
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/studio">
            <Button icon="auto_awesome">Recommend a crop</Button>
          </Link>
          <Link to="/yield">
            <Button variant="tonal" icon="query_stats">
              Forecast yield
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
        <StatTile
          label="Crop model accuracy"
          icon="verified"
          loading={status.isLoading}
          value={crop?.metrics?.test_accuracy != null ? fmtPct(crop.metrics.test_accuracy) : "—"}
          hint={crop ? `${titleCase(crop.model ?? crop.method)} · held-out test set` : "Loading model…"}
        />
        <StatTile
          label="Yield model R² (log)"
          icon="model_training"
          loading={status.isLoading}
          value={yieldModel?.metrics?.r2_log != null ? yieldModel.metrics.r2_log.toFixed(3) : "—"}
          hint={
            yieldModel?.loaded
              ? `${titleCase(yieldModel.model)} · MAE ${yieldModel.metrics.mae_t_ha.toFixed(2)} t/ha`
              : "Not loaded"
          }
        />
        <StatTile
          label="API throughput"
          icon="speed"
          loading={status.isLoading}
          value={s ? s.load.requests_per_s_1m.toFixed(2) : "—"}
          unit="req/s"
          hint={s ? `1-minute average · ${s.load.instance}` : ""}
          trend={samples.map((x) => x.rps)}
        />
        <StatTile
          label="p95 latency"
          icon="schedule"
          loading={status.isLoading}
          value={s ? fmtMs(s.load.latency_ms.p95) : "—"}
          hint={healthy != null ? `${healthy}/${s.services.length} services healthy` : ""}
          trend={samples.map((x) => x.p95)}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ProductionTrend />
        <Card
          title="Service map"
          subtitle="Health probes from the API, refreshed every 5 s"
          icon="hub"
          actions={
            <Link to="/system" className="text-[13px] font-medium text-primary hover:underline">
              Details
            </Link>
          }
        >
          <ServiceMap status={s} isLoading={status.isLoading} error={status.error} refetch={status.refetch} />
          {s && (
            <div className="mt-5 flex flex-col gap-3 border-t border-outline pt-4">
              {s.caches.map((cache) => (
                <Meter
                  key={cache.name}
                  label={`${titleCase(cache.name)} cache hit rate`}
                  value={cache.hit_rate}
                  max={1}
                  valueLabel={`${fmtPct(cache.hit_rate, 0)} · ${fmtNumber(cache.size)} entries`}
                  tone="good"
                />
              ))}
              {!s.caches.length && <p className="text-[13px] text-ink-3">Prediction caches fill as requests arrive.</p>}
              <p
                className={cx(
                  "flex items-center gap-1.5 text-[13px]",
                  s.assistant.llm_available ? "text-ink-2" : "text-ink-3",
                )}
              >
                <Icon name="smart_toy" size={18} />
                Assistant:{" "}
                {s.assistant.llm_available ? `Claude (${s.assistant.model})` : "knowledge-base mode (no LLM key)"}
              </p>
            </div>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <WeatherPanel />
      </section>
    </div>
  );
}
