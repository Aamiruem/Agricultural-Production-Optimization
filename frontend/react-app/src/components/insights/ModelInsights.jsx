import { useQuery } from "@tanstack/react-query";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { HBarChart } from "@/components/common/HBarChart";
import { Loader } from "@/components/common/Loader";
import { fetchModelInfo } from "@/services/mlService";
import { FEATURE_NAMES, MODEL_NAMES } from "@/utils/crops";
import { formatDateTime, formatPercent } from "@/utils/format";

const pct = (v) => (v === undefined ? "—" : formatPercent(v, 1));

/** ML model comparison (from `python -m ml.train`) + feature importance. */
export function ModelInsights() {
  const info = useQuery({ queryKey: ["ml-model"], queryFn: fetchModelInfo });

  if (info.isLoading) return <Loader label="Loading model info" />;
  if (info.isError) return <ErrorAlert error={info.error} />;

  const { serving, report } = info.data;
  if (!report) {
    return (
      <EmptyState>
        No trained model yet — recommendations use profile matching. Train one with <code>python -m ml.train</code>.
      </EmptyState>
    );
  }

  const rank = (m) => m.cv_f1_macro_mean ?? m.test_f1_macro;
  const rows = Object.entries(report.leaderboard).sort(([, a], [, b]) => rank(b) - rank(a));
  const importances = Object.entries(report.feature_importances ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => ({ label: FEATURE_NAMES[key] ?? key, value, display: formatPercent(value, 1) }));

  return (
    <div className="d-grid gap-4">
      <p className="small text-body-secondary mb-0">
        Serving <Badge bg="success">{MODEL_NAMES[serving.model] ?? serving.method}</Badge> trained on{" "}
        {report.rows.toLocaleString()} samples of {report.classes.length} crops · {formatDateTime(report.trained_at)}
      </p>
      <Table responsive bordered size="sm" className="tabular align-middle mb-0" aria-label="Model comparison">
        <thead>
          <tr>
            <th>Model</th>
            <th className="text-end">CV macro-F1 (5-fold)</th>
            <th className="text-end">Test accuracy</th>
            <th className="text-end">Test macro-F1</th>
            <th className="text-end">Precision</th>
            <th className="text-end">Recall</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, m]) => (
            <tr key={name} className={name === report.best_model ? "table-success" : ""}>
              <td>
                {MODEL_NAMES[name] ?? name}
                {name === report.best_model && <Badge bg="success" className="ms-2">best</Badge>}
              </td>
              <td className="text-end">{m.cv_f1_macro_mean === undefined ? "—" : `${pct(m.cv_f1_macro_mean)} ± ${pct(m.cv_f1_macro_std)}`}</td>
              <td className="text-end">{pct(m.test_accuracy)}</td>
              <td className="text-end">{pct(m.test_f1_macro)}</td>
              <td className="text-end">{pct(m.test_precision_macro)}</td>
              <td className="text-end">{pct(m.test_recall_macro)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {importances.length > 0 && (
        <div style={{ maxWidth: 560 }}>
          <HBarChart caption={`Feature importance (${MODEL_NAMES[report.best_model] ?? report.best_model})`} data={importances} />
        </div>
      )}
    </div>
  );
}
