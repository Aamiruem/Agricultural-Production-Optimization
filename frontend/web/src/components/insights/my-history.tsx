"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { useRef } from "react";

import { HBarChart } from "@/components/insights/hbar-chart";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/client";
import { fetchPredictions, fetchPredictionStats, uploadBatchCsv } from "@/lib/api/endpoints";
import { formatCropName, formatPercent } from "@/lib/crops";

export function MyHistory() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = useQuery({ queryKey: ["prediction-stats"], queryFn: fetchPredictionStats });
  const recent = useQuery({ queryKey: ["predictions"], queryFn: () => fetchPredictions(10) });
  const batch = useMutation({
    mutationFn: uploadBatchCsv,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prediction-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
  const error = stats.error ?? recent.error;

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-destructive">{getErrorMessage(error)}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {stats.data && stats.data.length > 0 ? (
            <HBarChart
              caption="Your recommendations by top crop"
              data={stats.data.map((s) => ({
                label: formatCropName(s.crop),
                value: s.count,
                display: `${s.count}×`,
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No saved recommendations yet. Recommendations you make while signed in are stored here.
            </p>
          )}
        </div>

        <div className="space-y-2 rounded-xl border p-4">
          <h3 className="text-sm font-medium">Batch recommendations (CSV)</h3>
          <p className="text-xs text-muted-foreground">
            Columns: <code className="font-mono">N,P,K,temperature,humidity,ph,rainfall</code> — up to 1,000 rows.
            Processed as a background job.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) batch.mutate(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={batch.isPending}>
            {batch.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Upload CSV
          </Button>
          {batch.isError && <p role="alert" className="text-xs text-destructive">{getErrorMessage(batch.error)}</p>}
          {batch.data && (
            <p className="text-sm" role="status">
              Job {batch.data.id.slice(0, 8)} · <span className="font-medium">{batch.data.status}</span> ·{" "}
              {batch.data.total_rows} rows
              {batch.data.result &&
                ` · top crops: ${[...new Set(batch.data.result.map((r) => formatCropName(r.top[0].crop)))].slice(0, 5).join(", ")}`}
            </p>
          )}
        </div>
      </div>

      {recent.data && recent.data.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <caption className="sr-only">Recent saved recommendations</caption>
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">N-P-K</th>
                <th className="px-3 py-2 font-medium">pH</th>
                <th className="px-3 py-2 font-medium">Rain</th>
                <th className="px-3 py-2 font-medium">Top crop</th>
                <th className="px-3 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 tabular-nums">{p.N}-{p.P}-{p.K}</td>
                  <td className="px-3 py-2 tabular-nums">{p.ph}</td>
                  <td className="px-3 py-2 tabular-nums">{p.rainfall} mm</td>
                  <td className="px-3 py-2">{formatCropName(p.top_crop)} ({formatPercent(p.confidence)})</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            Showing {recent.data.items.length} of {recent.data.total}
          </p>
        </div>
      )}
    </div>
  );
}
