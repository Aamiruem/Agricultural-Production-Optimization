import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { BarList, DivergingBars } from "@/components/charts/Charts.jsx";
import { cx } from "@/lib/cx.js";
import { CropPhoto } from "@/components/ui/CropPhoto.jsx";
import {
  Card,
  Chip,
  Code,
  ErrorState,
  Icon,
  RangeField,
  Segmented,
  Select,
  Skeleton,
  TextField,
} from "@/components/ui/primitives.jsx";
import { useDebounced } from "@/hooks/useSamples.js";
import { useLiveRecommend } from "@/hooks/useLiveRecommend.js";
import { api } from "@/lib/api.js";
import { FEATURE_LABELS, FEATURE_UNITS, fmtMs, fmtPct, fmtPoints, titleCase } from "@/lib/format.js";
import { useCrops } from "@/lib/queries.js";

const FIELDS = [
  { key: "N", min: 0, max: 200, step: 1, icon: "compost" },
  { key: "P", min: 0, max: 200, step: 1, icon: "compost" },
  { key: "K", min: 0, max: 250, step: 1, icon: "compost" },
  { key: "temperature", min: -10, max: 55, step: 0.5, icon: "thermostat" },
  { key: "humidity", min: 0, max: 100, step: 1, icon: "water_drop" },
  { key: "ph", min: 0, max: 14, step: 0.1, icon: "science" },
  { key: "rainfall", min: 0, max: 500, step: 5, icon: "rainy" },
];

const PRESETS = [
  { label: "Kharif paddy", soil: { N: 90, P: 42, K: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202 } },
  { label: "Black cotton soil", soil: { N: 118, P: 46, K: 20, temperature: 24, humidity: 80, ph: 6.9, rainfall: 80 } },
  { label: "Dry pulses", soil: { N: 40, P: 68, K: 80, temperature: 18.9, humidity: 17, ph: 7.3, rainfall: 80 } },
  { label: "Coastal orchard", soil: { N: 22, P: 17, K: 31, temperature: 27.4, humidity: 94, ph: 5.9, rainfall: 176 } },
];

function TransportBadge({ transport, ms }) {
  const map = {
    websocket: { icon: "bolt", text: "Live · WebSocket", tone: "text-good bg-good-soft" },
    rest: { icon: "sync", text: "Live · REST fallback", tone: "text-warn bg-warn-soft" },
    connecting: { icon: "schedule", text: "Connecting…", tone: "text-ink-2 bg-surface-2" },
  }[transport];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", map.tone)}>
      <Icon name={map.icon} size={16} />
      {map.text}
      {ms != null && transport !== "connecting" && <span className="font-normal opacity-80">· {fmtMs(ms)}</span>}
    </span>
  );
}

function Explanation({ soil }) {
  const [selected, setSelected] = useState(0);
  const q = useQuery({
    queryKey: ["explain", soil],
    queryFn: ({ signal }) => api.post("/api/ml/explain?top=3", soil, { signal }),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  if (q.isLoading) return <Skeleton className="h-72 w-full" />;
  if (q.error && !q.data) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const exps = q.data.explanations;
  const exp = exps[Math.min(selected, exps.length - 1)];
  const items = exp.contributions.map((c) => ({
    label: FEATURE_LABELS[c.feature] ?? c.feature,
    value: c.contribution,
    detail: [
      { label: "Reading", value: `${c.value}${FEATURE_UNITS[c.feature] ? ` ${FEATURE_UNITS[c.feature]}` : ""}` },
      { label: "Effect", value: fmtPoints(c.contribution) },
    ],
  }));
  const top = exp.contributions[0];

  return (
    <div className={cx("flex flex-col gap-4 transition-opacity", q.isFetching && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Crop to explain"
          value={Math.min(selected, exps.length - 1)}
          onChange={setSelected}
          options={exps.map((e, i) => ({ value: i, label: titleCase(e.crop) }))}
        />
        <span className="text-xs text-ink-3">
          {q.data.method} · {titleCase(q.data.model)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-3 text-center">
        <div>
          <p className="text-[11px] text-ink-3">Base rate</p>
          <p className="text-lg font-medium tabular-nums text-ink">{fmtPct(exp.base_value)}</p>
        </div>
        <div className="flex items-center justify-center text-ink-3">
          <Icon name="chevron_right" size={24} />
        </div>
        <div>
          <p className="text-[11px] text-ink-3">{titleCase(exp.crop)} probability</p>
          <p className="text-lg font-medium tabular-nums text-ink">{fmtPct(exp.probability)}</p>
        </div>
      </div>
      <DivergingBars
        items={items}
        format={fmtPoints}
        posLabel="Raises the probability"
        negLabel="Lowers the probability"
      />
      <p className="text-[13px] text-ink-2">
        <span className="font-medium text-ink">{FEATURE_LABELS[top.feature]}</span> has the largest effect: it{" "}
        {top.contribution >= 0 ? "raises" : "lowers"} the chance of {titleCase(exp.crop)} by{" "}
        {fmtPoints(top.contribution).replace(/^[+−]/, "")}.
        {q.data.method === "TreeSHAP" &&
          " Contributions are exact Shapley values: base rate + effects = predicted probability."}
      </p>
    </div>
  );
}

function FertilizerPlan({ soil, defaultCrop }) {
  const crops = useCrops();
  const [crop, setCrop] = useState("");
  const [area, setArea] = useState(1);
  const names = crops.data?.map((c) => c.name) ?? [];
  const active = crop || (names.includes(defaultCrop) ? defaultCrop : names[0]) || "";
  const body = { crop: active, N: soil.N, P: soil.P, K: soil.K, area_ha: Number(area) || 1 };
  const q = useQuery({
    queryKey: ["fertilizer", body],
    queryFn: ({ signal }) => api.post("/api/recommend/fertilizer", body, { signal }),
    enabled: Boolean(active) && Number(area) > 0,
    placeholderData: keepPreviousData,
  });

  return (
    <Card title="Fertilizer plan" subtitle="Closes the N-P-K gap with DAP, Urea and MOP" icon="compost">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Crop"
          value={active}
          onChange={setCrop}
          options={names.length ? names.map((n) => ({ value: n, label: titleCase(n) })) : [active]}
        />
        <TextField
          label="Area (ha)"
          type="number"
          min={0.1}
          step={0.1}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </div>
      {q.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={q.refetch} compact />
      ) : (
        q.data && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {q.data.doses.map((d) => (
                <div key={d.product} className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs text-ink-2">{d.product}</p>
                  <p className="text-xl font-medium tabular-nums text-ink">
                    {Math.round(d.total_kg)}
                    <span className="text-xs font-normal text-ink-2"> kg</span>
                  </p>
                  <p className="text-[11px] text-ink-3">{Math.round(d.kg_per_ha)} kg/ha</p>
                </div>
              ))}
            </div>
            <ul className="flex flex-col gap-1.5">
              {q.data.gaps.map((g) => (
                <li key={g.nutrient} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="text-ink-2">
                    {g.nutrient}: {g.current} → {g.target} kg/ha
                  </span>
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      g.status === "low"
                        ? "bg-warn-soft text-warn"
                        : g.status === "high"
                          ? "bg-primary-soft text-on-primary-soft"
                          : "bg-good-soft text-good",
                    )}
                  >
                    <Icon name={g.status === "ok" ? "check_circle" : "warning"} size={14} />
                    {g.status === "low"
                      ? `Short ${Math.round(g.deficit)}`
                      : g.status === "high"
                        ? "Surplus"
                        : "Adequate"}
                  </span>
                </li>
              ))}
            </ul>
            {q.data.advice?.length > 0 && (
              <ul className="flex flex-col gap-1 border-t border-outline pt-3 text-[13px] text-ink-2">
                {q.data.advice.map((a) => (
                  <li key={a} className="flex gap-2">
                    <Icon name="info" size={16} className="mt-0.5 text-ink-3" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}
    </Card>
  );
}

export default function StudioPage() {
  const [soil, setSoil] = useState(PRESETS[0].soil);
  const debounced = useDebounced(soil, 150);
  const explainSoil = useDebounced(soil, 400);
  const live = useLiveRecommend(debounced);
  const crops = useCrops();
  const top = live.result?.top ?? [];

  const loadProfile = (name) => {
    const c = crops.data?.find((x) => x.name === name);
    if (c)
      setSoil({
        N: c.N,
        P: c.P,
        K: c.K,
        temperature: c.temperature,
        humidity: c.humidity,
        ph: c.ph,
        rainfall: c.rainfall,
      });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(20rem,26rem)_1fr]">
      <Card
        title="Soil & climate"
        subtitle="Drag a slider — the model re-ranks crops as you move"
        icon="tune"
        className="xl:row-span-2"
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              active={JSON.stringify(p.soil) === JSON.stringify(soil)}
              onClick={() => setSoil(p.soil)}
            >
              {p.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {FIELDS.map((f) => (
            <RangeField
              key={f.key}
              id={`soil-${f.key}`}
              label={FEATURE_LABELS[f.key]}
              unit={FEATURE_UNITS[f.key]}
              icon={f.icon}
              value={soil[f.key]}
              min={f.min}
              max={f.max}
              step={f.step}
              onChange={(v) => setSoil((s) => ({ ...s, [f.key]: v }))}
            />
          ))}
        </div>
        {crops.data && (
          <div className="mt-5 border-t border-outline pt-4">
            <Select
              label="Load the ideal profile of a crop"
              value=""
              onChange={loadProfile}
              options={[
                { value: "", label: "Choose a crop…" },
                ...crops.data.map((c) => ({ value: c.name, label: titleCase(c.name) })),
              ]}
            />
          </div>
        )}
      </Card>

      <Card
        title="Recommended crops"
        subtitle="Random Forest probability for the current readings"
        icon="auto_awesome"
        actions={<TransportBadge transport={live.transport} ms={live.result?.ms} />}
      >
        {live.error && (
          <p className="mb-3 flex items-center gap-1.5 text-[13px] text-bad">
            <Icon name="error" size={16} />
            {live.error}
          </p>
        )}
        {!live.result ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CropPhoto crop={top[0]?.crop} size={56} />
              <div>
                <p className="text-[22px] font-medium text-ink">{titleCase(top[0]?.crop)}</p>
                <p className="text-[13px] text-ink-2">
                  {fmtPct(top[0]?.confidence)} confidence · {titleCase(top[0]?.season)} · {titleCase(top[0]?.category)}
                </p>
              </div>
              <span className="ml-auto text-xs text-ink-3">
                {live.result.method === "ml-model" ? "Trained model" : "Profile similarity"}
              </span>
            </div>
            <BarList
              max={1}
              format={(v) => fmtPct(v)}
              highlight={titleCase(top[0]?.crop)}
              items={top.map((t) => ({
                label: titleCase(t.crop),
                value: t.confidence,
                detail: [
                  { label: "Season", value: titleCase(t.season) },
                  { label: "Category", value: titleCase(t.category) },
                ],
              }))}
            />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <Card
          title="Why this crop?"
          subtitle="Per-feature contribution to the probability (TreeSHAP)"
          icon="psychology"
        >
          <Explanation soil={explainSoil} />
        </Card>
        <FertilizerPlan soil={explainSoil} defaultCrop={top[0]?.crop} />
      </div>

      <p className="text-xs text-ink-3 xl:col-start-2">
        Endpoints: <Code>WS /api/ws/recommend</Code> · <Code>POST /api/ml/explain</Code> ·{" "}
        <Code>POST /api/recommend/fertilizer</Code>. Repeated readings are answered from the API&apos;s prediction
        cache.
      </p>
    </div>
  );
}
