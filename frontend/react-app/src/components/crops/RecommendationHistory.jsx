import { Trash2 } from "lucide-react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import { useHistoryStore } from "@/store/historyStore";
import { formatCropName } from "@/utils/crops";
import { formatDateTime, formatPercent } from "@/utils/format";

/** Recent recommendations kept in this browser (Zustand + localStorage). */
export function RecommendationHistory() {
  const entries = useHistoryStore((s) => s.entries);
  const remove = useHistoryStore((s) => s.remove);
  const clear = useHistoryStore((s) => s.clear);
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="recent-title" className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 id="recent-title" className="h5 mb-0">
          Recent recommendations
        </h2>
        <Button variant="link" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>
      <Table responsive hover size="sm" className="align-middle">
        <thead>
          <tr>
            <th>When</th>
            <th>N-P-K</th>
            <th>pH</th>
            <th>Best crop</th>
            <th>
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const best = e.result.top[0];
            return (
              <tr key={e.id}>
                <td className="text-body-secondary text-nowrap">{formatDateTime(e.createdAt)}</td>
                <td className="tabular">
                  {e.soil.N}-{e.soil.P}-{e.soil.K}
                </td>
                <td className="tabular">{e.soil.ph}</td>
                <td>{best ? `${formatCropName(best.crop)} (${formatPercent(best.confidence)})` : "—"}</td>
                <td className="text-end">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-body-secondary"
                    onClick={() => remove(e.id)}
                    aria-label="Delete entry"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </section>
  );
}
