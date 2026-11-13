"use client";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useQuery } from "@tanstack/react-query";

import { HBarChart } from "@/components/insights/hbar-chart";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/api/client";
import { fetchModelInfo } from "@/lib/api/endpoints";
import { formatPercent } from "@/lib/crops";

const MODEL_NAMES: Record<string, string> = {
  logistic_regression: "Logistic regression",
  random_forest: "Random forest",
  xgboost: "XGBoost",
  pytorch_mlp: "PyTorch MLP",
};

const FEATURE_NAMES: Record<string, string> = {
  N: "Nitrogen (N)",
  P: "Phosphorus (P)",
  K: "Potassium (K)",
  ph: "Soil pH",
  temperature: "Temperature",
  humidity: "Humidity",
  rainfall: "Rainfall",
};

const pct = (v?: number) => (v === undefined ? "—" : formatPercent(v, 1));

export function ModelInsights() {
  const info = useQuery({ queryKey: ["ml-model"], queryFn: fetchModelInfo });

  if (info.isLoading) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  if (info.isError) return <p role="alert" className="text-sm text-destructive">{getErrorMessage(info.error)}</p>;

  const { serving, report } = info.data!;
  if (!report) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No trained model yet — recommendations use profile matching. Train one with{" "}
        <code className="font-mono">python -m ml.train</code>.
      </p>
    );
  }

  const rows = Object.entries(report.leaderboard).sort(
    ([, a], [, b]) => (b.cv_f1_macro_mean ?? b.test_f1_macro) - (a.cv_f1_macro_mean ?? a.test_f1_macro),
  );
  const importances = Object.entries(report.feature_importances ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => ({ label: FEATURE_NAMES[key] ?? key, value, display: formatPercent(value, 1) }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Serving <Badge variant="secondary">{MODEL_NAMES[serving.model ?? ""] ?? serving.method}</Badge> trained on{" "}
        {report.rows.toLocaleString()} samples of {report.classes.length} crops ·{" "}
        {new Date(report.trained_at).toLocaleString()}
      </p>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="Model comparison">
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell align="right">CV macro-F1 (5-fold)</TableCell>
              <TableCell align="right">Test accuracy</TableCell>
              <TableCell align="right">Test macro-F1</TableCell>
              <TableCell align="right">Precision</TableCell>
              <TableCell align="right">Recall</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(([name, m]) => (
              <TableRow key={name} selected={name === report.best_model}>
                <TableCell>
                  {MODEL_NAMES[name] ?? name}
                  {name === report.best_model && <Badge className="ml-2">best</Badge>}
                </TableCell>
                <TableCell align="right" className="tabular-nums">
                  {m.cv_f1_macro_mean === undefined ? "—" : `${pct(m.cv_f1_macro_mean)} ± ${pct(m.cv_f1_macro_std)}`}
                </TableCell>
                <TableCell align="right" className="tabular-nums">{pct(m.test_accuracy)}</TableCell>
                <TableCell align="right" className="tabular-nums">{pct(m.test_f1_macro)}</TableCell>
                <TableCell align="right" className="tabular-nums">{pct(m.test_precision_macro)}</TableCell>
                <TableCell align="right" className="tabular-nums">{pct(m.test_recall_macro)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {importances.length > 0 && (
        <div className="max-w-xl">
          <HBarChart caption={`Feature importance (${MODEL_NAMES[report.best_model] ?? report.best_model})`} data={importances} />
        </div>
      )}
    </div>
  );
}
