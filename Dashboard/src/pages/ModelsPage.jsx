import { BarList, ChartCard, DataTable } from "@/components/charts/Charts.jsx";
import { Button, Card, ErrorState, Icon, KeyValue, Skeleton } from "@/components/ui/primitives.jsx";
import { useAuth } from "@/context/auth.js";
import { FEATURE_LABELS, fmtNumber, fmtPct, titleCase } from "@/lib/format.js";
import { useModel, useReloadModel, useYieldModel } from "@/lib/queries.js";

function CropModel() {
  const q = useModel();
  const { user } = useAuth();
  const reload = useReloadModel();
  if (q.isLoading) return <Skeleton className="h-96 w-full xl:col-span-2" />;
  if (q.error)
    return (
      <Card className="xl:col-span-2">
        <ErrorState error={q.error} onRetry={q.refetch} />
      </Card>
    );
  const { serving, report } = q.data;
  const board = Object.entries(report?.leaderboard ?? {})
    .map(([name, m]) => ({ name, ...m }))
    .sort((a, b) => b.test_f1_macro - a.test_f1_macro);
  const importance = Object.entries(report?.feature_importances ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Card
        title="Crop recommender"
        subtitle="Model currently served by the API"
        icon="psychology"
        actions={
          user?.role === "admin" && (
            <Button
              variant="outlined"
              size="sm"
              icon="refresh"
              loading={reload.isPending}
              onClick={() => reload.mutate()}
            >
              Hot-reload model
            </Button>
          )
        }
      >
        <KeyValue
          items={[
            [
              "Serving",
              serving.method === "ml-model" ? titleCase(serving.model) : "Profile similarity (no trained model)",
            ],
            ["Trained", serving.trained_at ? new Date(serving.trained_at).toLocaleString("en-IN") : "—"],
            ["Test accuracy", fmtPct(serving.metrics?.test_accuracy)],
            ["Macro F1", fmtPct(serving.metrics?.test_f1_macro)],
            ["Cross-validated accuracy", fmtPct(serving.metrics?.cv_accuracy_mean)],
            ["Training rows", fmtNumber(report?.rows)],
            ["Crops (classes)", report?.classes?.length ?? "—"],
            ["Explanations", "TreeSHAP per prediction"],
          ]}
        />
        {reload.error && <p className="mt-3 text-[13px] text-bad">{reload.error.message}</p>}
        {reload.isSuccess && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-good">
            <Icon name="check_circle" size={16} />
            Reloaded; prediction caches cleared.
          </p>
        )}
      </Card>

      <ChartCard
        title="Candidate leaderboard"
        subtitle="Macro F1 on the held-out test split — the best model is promoted"
        icon="model_training"
        table={{
          columns: [
            { key: "name", label: "Model", format: (v) => titleCase(v) },
            { key: "test_accuracy", label: "Accuracy", align: "right", format: (v) => fmtPct(v) },
            { key: "test_f1_macro", label: "Macro F1", align: "right", format: (v) => fmtPct(v) },
            { key: "cv_f1_macro_mean", label: "CV F1", align: "right", format: (v) => fmtPct(v) },
            { key: "cv_f1_macro_std", label: "CV F1 σ", align: "right", format: (v) => fmtPct(v, 2) },
          ],
          rows: board,
        }}
      >
        {board.length ? (
          <BarList
            max={1}
            format={(v) => fmtPct(v)}
            highlight={titleCase(report.best_model)}
            items={board.map((m) => ({
              label: titleCase(m.name),
              value: m.test_f1_macro,
              detail: [
                { label: "Accuracy", value: fmtPct(m.test_accuracy) },
                { label: "CV F1", value: `${fmtPct(m.cv_f1_macro_mean)} ± ${fmtPct(m.cv_f1_macro_std, 1)}` },
              ],
            }))}
          />
        ) : (
          <p className="text-sm text-ink-2">
            No training report found. Run <code>python -m AIML.machine_learning.crop_classifier</code>.
          </p>
        )}
      </ChartCard>

      <ChartCard
        title="What the model relies on"
        subtitle="Global feature importance (mean decrease in impurity)"
        icon="insights"
        table={{
          columns: [
            { key: "f", label: "Feature" },
            { key: "v", label: "Importance", align: "right", format: (v) => fmtPct(v) },
          ],
          rows: importance.map(([f, v]) => ({ f: FEATURE_LABELS[f] ?? f, v })),
        }}
      >
        <BarList
          format={(v) => fmtPct(v)}
          items={importance.map(([f, v]) => ({ label: FEATURE_LABELS[f] ?? f, value: v }))}
        />
      </ChartCard>
    </>
  );
}

function YieldModel() {
  const q = useYieldModel();
  if (q.isLoading) return <Skeleton className="h-80 w-full" />;
  if (q.error)
    return (
      <Card>
        <ErrorState error={q.error} onRetry={q.refetch} />
      </Card>
    );
  const rows = Object.entries(q.data.leaderboard)
    .map(([name, m]) => ({ name, ...m }))
    .sort((a, b) => b.r2_log - a.r2_log);
  return (
    <ChartCard
      title="Yield regressors"
      subtitle={`R² on log-yield, time split (${q.data.split}) · ${fmtNumber(q.data.rows)} rows`}
      icon="query_stats"
      className="xl:col-span-2"
      table={{
        columns: [
          { key: "name", label: "Model", format: (v) => titleCase(v) },
          { key: "r2_log", label: "R² (log)", align: "right", format: (v) => v.toFixed(3) },
          { key: "rmse_log", label: "RMSE (log)", align: "right", format: (v) => v.toFixed(3) },
          { key: "mae_t_ha", label: "MAE (t/ha)", align: "right", format: (v) => v.toFixed(2) },
          { key: "median_ape", label: "Median APE", align: "right", format: (v) => fmtPct(v) },
        ],
        rows,
      }}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarList
          max={1}
          format={(v) => v.toFixed(3)}
          highlight={titleCase(q.data.best_model)}
          items={rows.map((m) => ({
            label: titleCase(m.name),
            value: Math.max(m.r2_log, 0),
            detail: [
              { label: "MAE", value: `${m.mae_t_ha.toFixed(2)} t/ha` },
              { label: "Median APE", value: fmtPct(m.median_ape) },
            ],
          }))}
        />
        <DataTable
          maxHeight={300}
          rows={rows}
          columns={[
            {
              key: "name",
              label: "Model",
              format: (v) =>
                v === q.data.best_model ? <span className="font-medium">{titleCase(v)} · serving</span> : titleCase(v),
            },
            { key: "mae_t_ha", label: "MAE (t/ha)", align: "right", format: (v) => v.toFixed(2) },
            { key: "median_ape", label: "Median APE", align: "right", format: (v) => fmtPct(v) },
          ]}
        />
      </div>
    </ChartCard>
  );
}

export default function ModelsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <CropModel />
      <YieldModel />
    </div>
  );
}
