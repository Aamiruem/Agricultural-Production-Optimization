"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCropName, formatPercent } from "@/lib/crops";
import { useHistoryStore } from "@/store/history-store";

export function RecommendationHistory() {
  const entries = useHistoryStore((s) => s.entries);
  const remove = useHistoryStore((s) => s.remove);
  const clear = useHistoryStore((s) => s.clear);

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="history-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="history-title" className="text-lg font-semibold">
          Recent recommendations
        </h2>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">N-P-K</th>
              <th className="px-3 py-2 font-medium">pH</th>
              <th className="px-3 py-2 font-medium">Best crop</th>
              <th className="px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const best = e.result.top[0];
              return (
                <tr key={e.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {e.soil.N}-{e.soil.P}-{e.soil.K}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{e.soil.ph}</td>
                  <td className="px-3 py-2">
                    {best ? `${formatCropName(best.crop)} (${formatPercent(best.confidence)})` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(e.id)}
                      aria-label="Delete entry"
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
