import { useState } from "react";

import { BarList, ChartCard, DataTable, SegmentedBar, TrendChart } from "@/components/charts/Charts.jsx";
import { useChartColors } from "@/components/charts/useChartColors.js";
import {
  Button,
  Card,
  Code,
  ErrorState,
  Icon,
  KeyValue,
  Meter,
  Segmented,
  Skeleton,
} from "@/components/ui/primitives.jsx";
import { StatTile } from "@/components/ui/StatTile.jsx";
import { useSamples } from "@/hooks/useSamples.js";
import { ApiError, requestRaw, resetBreakers } from "@/lib/api.js";
import { fmtDuration, fmtMs, fmtNumber, fmtPct, titleCase } from "@/lib/format.js";
import { useSystemMetrics, useSystemStatus } from "@/lib/queries.js";

import { ServiceMap } from "./OverviewPage.jsx";

const clock = (t) => new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function randomSoil() {
  const r = (a, b) => Math.round((a + Math.random() * (b - a)) * 10) / 10;
  return {
    N: r(0, 140),
    P: r(5, 145),
    K: r(5, 205),
    temperature: r(10, 40),
    humidity: r(15, 99),
    ph: r(4, 9),
    rainfall: r(20, 300),
  };
}

const pct = (sorted, q) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.round(q * (sorted.length - 1)))] : 0;

/** Fires `total` crop recommendations with `concurrency` in flight; tallies status, latency and serving instance. */
async function runProbe(total, concurrency, onProgress) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < total) {
      next += 1;
      const started = performance.now();
      try {
        const res = await requestRaw("/api/recommend/crop", {
          method: "POST",
          body: randomSoil(),
          retries: 0,
          auth: false,
          timeoutMs: 15_000,
        });
        results.push({
          status: res.status,
          ms: res.ms,
          instance: res.headers.get("x-served-by") ?? res.headers.get("x-upstream") ?? "unknown",
        });
      } catch (error) {
        results.push({
          status: error instanceof ApiError ? error.status : 0,
          ms: performance.now() - started,
          instance: "—",
        });
      }
      onProgress(results.length);
    }
  };
  const t0 = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  resetBreakers(); // the probe is deliberate load; don't leave the UI failing fast
  const wall = performance.now() - t0;
  const lat = results.map((r) => r.ms).sort((a, b) => a - b);
  const byStatus = {};
  const byInstance = {};
  for (const r of results) {
    const k = r.status === 0 ? "network error" : String(r.status);
    byStatus[k] = (byStatus[k] ?? 0) + 1;
    if (r.status === 200) byInstance[r.instance] = (byInstance[r.instance] ?? 0) + 1;
  }
  return {
    total,
    concurrency,
    wall,
    rps: results.length / (wall / 1000),
    p50: pct(lat, 0.5),
    p95: pct(lat, 0.95),
    byStatus,
    byInstance,
  };
}

function LoadProbe() {
  const [size, setSize] = useState("100");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [report, setReport] = useState(null);
  const total = Number(size);
  const start = async () => {
    setRunning(true);
    setDone(0);
    setReport(null);
    try {
      setReport(await runProbe(total, Math.min(25, total), setDone));
    } finally {
      setRunning(false);
    }
  };
  const ok = report?.byStatus["200"] ?? 0;
  return (
    <Card
      title="Load probe"
      subtitle="Concurrent crop recommendations with random soils (cache misses)"
      icon="rocket_launch"
      actions={
        <>
          <Segmented label="Requests" value={size} onChange={setSize} options={["50", "100", "300"]} />
          <Button icon="play_arrow" size="sm" loading={running} onClick={start}>
            Run
          </Button>
        </>
      }
    >
      {running && <Meter label="Progress" value={done} max={total} valueLabel={`${done} / ${total}`} />}
      {!running && !report && (
        <p className="text-[13px] text-ink-2">
          Sends up to 25 requests at a time. Behind the gateway, successful responses spread across replicas (
          <Code>X-Served-By</Code>); past each worker&apos;s concurrency cap the API sheds load with{" "}
          <Code>503 + Retry-After</Code> instead of timing out.
        </p>
      )}
      {report && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Succeeded", `${fmtPct(ok / report.total, 0)}`],
              ["Throughput", `${report.rps.toFixed(1)} req/s`],
              ["p50", fmtMs(report.p50)],
              ["p95", fmtMs(report.p95)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface-2 p-3">
                <p className="text-xs text-ink-2">{k}</p>
                <p className="text-lg font-medium tabular-nums text-ink">{v}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink">Answered by</p>
              <BarList
                format={(v) => fmtNumber(v)}
                items={Object.entries(report.byInstance)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value }))}
              />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink">Responses</p>
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {Object.entries(report.byStatus).map(([code, n]) => (
                  <li key={code} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <Icon
                        name={code === "200" ? "check_circle" : code === "503" || code === "429" ? "warning" : "error"}
                        size={16}
                        className={
                          code === "200" ? "text-good" : code === "503" || code === "429" ? "text-warn" : "text-bad"
                        }
                      />
                      {code === "200"
                        ? "200 OK"
                        : code === "503"
                          ? "503 shed (busy)"
                          : code === "429"
                            ? "429 rate limited"
                            : code}
                    </span>
                    <span className="font-medium tabular-nums text-ink">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SystemPage() {
  const c = useChartColors();
  const status = useSystemStatus();
  const metrics = useSystemMetrics();
  const m = metrics.data;
  const samples = useSamples(
    m ? { rps: m.requests_per_s_1m, p95: m.latency_ms.p95, p50: m.latency_ms.p50, instance: m.instance } : null,
    metrics.dataUpdatedAt,
    60,
  );
  const points = samples.map((x) => ({ ...x, time: clock(x.t) }));
  const instances = samples.reduce((acc, x) => ({ ...acc, [x.instance]: (acc[x.instance] ?? 0) + 1 }), {});
  const s = status.data;

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Load">
        <StatTile
          label="In-flight requests"
          icon="memory"
          loading={metrics.isLoading}
          value={m ? fmtNumber(m.in_flight) : "—"}
          hint={m ? `Peak ${m.peak_in_flight} · cap ${m.max_concurrency} per worker` : ""}
        />
        <StatTile
          label="Requests served"
          icon="dns"
          loading={metrics.isLoading}
          value={m ? fmtNumber(m.requests_total) : "—"}
          hint={m ? `This worker · up ${fmtDuration(m.uptime_s)}` : ""}
        />
        <StatTile
          label="Shed under load"
          icon="warning"
          loading={metrics.isLoading}
          value={m ? fmtNumber(m.rejected_total) : "—"}
          hint="503 + Retry-After instead of timeouts"
        />
        <StatTile
          label="Replicas seen"
          icon="hub"
          loading={metrics.isLoading}
          value={Object.keys(instances).length || "—"}
          hint="Distinct workers answering these polls"
        />
      </section>

      {metrics.error && !m && (
        <Card>
          <ErrorState error={metrics.error} onRetry={metrics.refetch} />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Throughput"
          subtitle="Requests per second (1-minute average) of the answering worker, sampled every 2 s"
          icon="speed"
          table={{
            columns: [
              { key: "time", label: "Time" },
              { key: "rps", label: "req/s", align: "right", format: (v) => v.toFixed(3) },
              { key: "instance", label: "Worker" },
            ],
            rows: [...points].reverse(),
          }}
        >
          {points.length < 2 ? (
            <Skeleton className="h-55" />
          ) : (
            <TrendChart
              data={points}
              xKey="time"
              height={220}
              area
              series={[{ key: "rps", label: "req/s" }]}
              yFormat={(v) => Number(v).toFixed(2)}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Latency"
          subtitle="Rolling percentiles over the worker's last 4,096 requests"
          icon="schedule"
          legend={[
            { label: "p50", color: c.series[0], shape: "line" },
            { label: "p95", color: c.series[1], shape: "line" },
          ]}
          table={{
            columns: [
              { key: "time", label: "Time" },
              { key: "p50", label: "p50 (ms)", align: "right" },
              { key: "p95", label: "p95 (ms)", align: "right" },
            ],
            rows: [...points].reverse(),
          }}
        >
          {points.length < 2 ? (
            <Skeleton className="h-55" />
          ) : (
            <TrendChart
              data={points}
              xKey="time"
              height={220}
              yFormat={(v) => fmtMs(v)}
              series={[
                { key: "p50", label: "p50", slot: 0 },
                { key: "p95", label: "p95", slot: 1 },
              ]}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Services" subtitle="Probed by the API every 5 s" icon="hub">
          <ServiceMap status={s} isLoading={status.isLoading} error={status.error} refetch={status.refetch} />
          {s && (
            <div className="mt-5 border-t border-outline pt-4">
              <KeyValue
                columns={1}
                items={[
                  ["Environment", s.environment],
                  ["Python", `${s.runtime.python} · ${s.runtime.platform}`],
                  ["Task queue", s.queue.broker],
                  [
                    "Farm realtime",
                    s.services.find((x) => x.name === "farm-service")?.details?.realtime?.adapter ?? "—",
                  ],
                ]}
              />
            </div>
          )}
        </Card>
        <Card title="Responses by class" subtitle="This worker since start" icon="bar_chart">
          {m ? (
            <SegmentedBar
              parts={[
                { label: "2xx", value: m.status["2xx"] ?? 0, color: c.good },
                { label: "4xx", value: m.status["4xx"] ?? 0, color: c.warn },
                { label: "5xx", value: m.status["5xx"] ?? 0, color: c.bad },
              ]}
            />
          ) : (
            <Skeleton className="h-10" />
          )}
          <p className="mt-5 mb-2 text-[13px] font-medium text-ink">Replica distribution of these polls</p>
          <BarList
            format={(v) => fmtNumber(v)}
            items={Object.entries(instances)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => ({ label, value }))}
          />
        </Card>
        <Card title="Prediction caches" subtitle="In-memory TTL + LRU per worker" icon="storage">
          {s?.caches?.length ? (
            <div className="flex flex-col gap-4">
              {s.caches.map((cache) => (
                <div key={cache.name} className="flex flex-col gap-1.5">
                  <Meter
                    label={titleCase(cache.name)}
                    value={cache.hit_rate}
                    max={1}
                    tone="good"
                    valueLabel={`${fmtPct(cache.hit_rate, 0)} hits`}
                  />
                  <p className="text-xs text-ink-3">
                    {fmtNumber(cache.size)}/{fmtNumber(cache.maxsize)} entries · {fmtNumber(cache.hits)} hits ·{" "}
                    {fmtNumber(cache.misses)} misses · TTL {fmtDuration(cache.ttl_s)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-2">Caches appear after the first prediction on this worker.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Busiest routes" subtitle="Request count per route template (this worker)" icon="api">
          {m ? (
            <DataTable
              columns={[
                { key: "route", label: "Route", format: (v) => <Code>{v}</Code> },
                { key: "count", label: "Requests", align: "right", format: (v) => fmtNumber(v) },
              ]}
              rows={m.top_routes}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
        </Card>
        <LoadProbe />
      </div>
    </div>
  );
}
