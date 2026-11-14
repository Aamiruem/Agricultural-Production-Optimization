import { useMemo, useState } from "react";

import { ChartCard, ColumnChart, TrendChart } from "@/components/charts/Charts.jsx";
import { Button, Card, ErrorState, Icon, Select, Skeleton, TextField } from "@/components/ui/primitives.jsx";
import { CropPhoto } from "@/components/ui/CropPhoto.jsx";
import { StatTile } from "@/components/ui/StatTile.jsx";
import { fmtNumber } from "@/lib/format.js";
import { useCoverage, useTrend, useYieldPredict } from "@/lib/queries.js";

function QuartileRange({ history, predicted }) {
  if (!history) return <p className="text-[13px] text-ink-3">No historical spread for this combination.</p>;
  const lo = Math.min(history.p25, predicted) * 0.9;
  const hi = Math.max(history.p75, predicted) * 1.1;
  const pos = (v) => `${((v - lo) / (hi - lo || 1)) * 100}%`;
  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative h-8"
        role="img"
        aria-label={`Historical 25th to 75th percentile ${history.p25.toFixed(2)} to ${history.p75.toFixed(2)} t/ha, median ${history.median.toFixed(2)}, forecast ${predicted.toFixed(2)}`}
      >
        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-surface-2" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary-soft"
          style={{ left: pos(history.p25), width: `calc(${pos(history.p75)} - ${pos(history.p25)})` }}
        />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-ink-3" style={{ left: pos(history.median) }} />
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-primary"
          style={{ left: pos(predicted) }}
        />
      </div>
      <div className="flex justify-between text-xs text-ink-2">
        <span>P25 {history.p25.toFixed(2)}</span>
        <span>Median {history.median.toFixed(2)}</span>
        <span>P75 {history.p75.toFixed(2)} t/ha</span>
      </div>
      <p className="text-xs text-ink-3">Shaded: middle half of {history.n} historical seasons · dot: this forecast.</p>
    </div>
  );
}

export default function YieldPage() {
  const coverage = useCoverage();
  const [state, setState] = useState("Punjab");
  const [crop, setCrop] = useState("Rice");
  const [season, setSeason] = useState("All seasons");
  const [form, setForm] = useState({ year: new Date().getFullYear(), area_ha: 2, annual_rainfall: "" });
  const predict = useYieldPredict();

  const crops = useMemo(
    () =>
      (coverage.data?.state_crops ?? [])
        .filter(([s]) => s === state)
        .map(([, c]) => c)
        .sort(),
    [coverage.data, state],
  );
  const activeCrop = crops.includes(crop) ? crop : (crops[0] ?? crop);
  const trend = useTrend(state, activeCrop, season);
  const points = useMemo(() => trend.data?.points ?? [], [trend.data]);
  const seasons = ["All seasons", ...(coverage.data?.seasons ?? [])];
  const predictSeason =
    season === "All seasons"
      ? coverage.data?.seasons?.includes("Kharif")
        ? "Kharif"
        : coverage.data?.seasons?.[0]
      : season;

  const stats = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const best = points.reduce((a, b) => (b.yield_t_ha > a.yield_t_ha ? b : a));
    const years = last.year - first.year || 1;
    const cagr = first.yield_t_ha > 0 ? (last.yield_t_ha / first.yield_t_ha) ** (1 / years) - 1 : 0;
    return { last, best, cagr };
  }, [points]);

  const submit = (e) => {
    e.preventDefault();
    predict.mutate({
      crop: activeCrop,
      state,
      season: predictSeason,
      year: Number(form.year),
      area_ha: Number(form.area_ha),
      annual_rainfall: form.annual_rainfall === "" ? null : Number(form.annual_rainfall),
    });
  };

  const table = {
    columns: [
      { key: "year", label: "Year" },
      { key: "yield_t_ha", label: "Yield (t/ha)", align: "right", format: (v) => v.toFixed(3) },
      { key: "production_t", label: "Production (t)", align: "right", format: (v) => fmtNumber(v) },
      { key: "area_ha", label: "Area (ha)", align: "right", format: (v) => fmtNumber(v) },
    ],
    rows: points,
  };

  return (
    <div className="flex flex-col gap-4">
      <Card bodyClassName="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select label="State" value={state} onChange={setState} options={coverage.data?.states ?? [state]} />
        <Select label="Crop" value={activeCrop} onChange={setCrop} options={crops.length ? crops : [activeCrop]} />
        <Select label="Season" value={season} onChange={setSeason} options={seasons} />
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Trend summary">
        <StatTile
          label={`Latest yield (${stats?.last.year ?? "—"})`}
          icon="grass"
          loading={trend.isLoading}
          value={stats ? stats.last.yield_t_ha.toFixed(2) : "—"}
          unit="t/ha"
          hint={stats ? `${fmtNumber(stats.last.area_ha)} ha harvested` : ""}
        />
        <StatTile
          label="Best season on record"
          icon="verified"
          loading={trend.isLoading}
          value={stats ? stats.best.yield_t_ha.toFixed(2) : "—"}
          unit="t/ha"
          hint={stats ? `Crop year ${stats.best.year}` : ""}
        />
        <StatTile
          label="Yield growth per year"
          icon="trending_up"
          loading={trend.isLoading}
          value={stats ? `${(stats.cagr * 100).toFixed(1)}%` : "—"}
          hint={stats ? "Compound annual rate over the record" : ""}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Yield per hectare"
          subtitle={`${activeCrop} · ${state} · ${season}`}
          icon="show_chart"
          table={table}
        >
          {trend.isLoading ? (
            <Skeleton className="h-65" />
          ) : trend.error ? (
            <ErrorState error={trend.error} onRetry={trend.refetch} />
          ) : points.length ? (
            <TrendChart
              data={points}
              xKey="year"
              area
              series={[{ key: "yield_t_ha", label: "Yield (t/ha)" }]}
              yFormat={(v) => Number(v).toFixed(1)}
            />
          ) : (
            <p className="py-16 text-center text-sm text-ink-2">No records for this selection.</p>
          )}
        </ChartCard>
        <ChartCard title="Total production" subtitle="Tonnes harvested per crop year" icon="bar_chart" table={table}>
          {trend.isLoading ? (
            <Skeleton className="h-65" />
          ) : trend.error ? (
            <ErrorState error={trend.error} compact />
          ) : points.length ? (
            <ColumnChart
              data={points}
              xKey="year"
              height={260}
              series={[{ key: "production_t", label: "Production (t)" }]}
            />
          ) : (
            <p className="py-16 text-center text-sm text-ink-2">No records for this selection.</p>
          )}
        </ChartCard>
      </div>

      <Card
        title="Forecast a season"
        subtitle={`XGBoost regression for ${activeCrop} · ${state} · ${predictSeason ?? ""}`}
        icon="model_training"
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <TextField
            label="Crop year"
            type="number"
            min={1997}
            max={2100}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            required
          />
          <TextField
            label="Field area (ha)"
            type="number"
            min={0.01}
            step={0.01}
            value={form.area_ha}
            onChange={(e) => setForm({ ...form, area_ha: e.target.value })}
            required
          />
          <TextField
            label="Annual rainfall (mm, optional)"
            type="number"
            min={0}
            placeholder="State average"
            value={form.annual_rainfall}
            onChange={(e) => setForm({ ...form, annual_rainfall: e.target.value })}
          />
          <Button type="submit" icon="play_arrow" loading={predict.isPending}>
            Predict yield
          </Button>
        </form>
        {predict.error && (
          <div className="mt-4">
            <ErrorState error={predict.error} compact />
          </div>
        )}
        {predict.data && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-outline pt-5 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex items-center gap-6">
              <CropPhoto crop={activeCrop} size={64} />
              <div>
                <p className="text-xs text-ink-2">Expected yield</p>
                <p className="text-[28px] font-medium tabular-nums text-ink">
                  {predict.data.yield_t_ha.toFixed(2)}
                  <span className="text-sm font-normal text-ink-2"> t/ha</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-2">Field production</p>
                <p className="text-[28px] font-medium tabular-nums text-ink">
                  {fmtNumber(predict.data.production_t, { decimals: 1 })}
                  <span className="text-sm font-normal text-ink-2"> t</span>
                </p>
              </div>
            </div>
            <QuartileRange history={predict.data.history} predicted={predict.data.yield_t_ha} />
            <p className="flex items-center gap-1.5 text-xs text-ink-3 md:col-span-2">
              <Icon name="info" size={16} /> {predict.data.model}. Forecasts use state-level history; local soil, seed
              and management change real outcomes.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
