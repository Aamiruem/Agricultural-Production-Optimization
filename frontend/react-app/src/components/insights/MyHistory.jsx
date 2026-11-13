import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { HBarChart } from "@/components/common/HBarChart";
import { fetchPredictionStats, fetchPredictions } from "@/services/cropService";
import { formatCropName } from "@/utils/crops";
import { formatDateTime, formatPercent } from "@/utils/format";

import { BatchUpload } from "./BatchUpload";

const PAGE = 10;

/** Recommendations saved to PostgreSQL for the signed-in user (paginated). */
export function MyHistory() {
  const [page, setPage] = useState(0);
  const stats = useQuery({ queryKey: ["prediction-stats"], queryFn: fetchPredictionStats });
  const recent = useQuery({
    queryKey: ["predictions", page],
    queryFn: () => fetchPredictions(PAGE, page * PAGE),
    placeholderData: (prev) => prev, // keep the table while the next page loads
  });
  const total = recent.data?.total ?? 0;

  return (
    <div className="d-grid gap-4">
      <ErrorAlert error={stats.error ?? recent.error} />
      <Row className="g-4">
        <Col lg={6}>
          {stats.data?.length ? (
            <HBarChart
              caption="Your recommendations by top crop"
              data={stats.data.map((s) => ({ label: formatCropName(s.crop), value: s.count, display: `${s.count}×` }))}
            />
          ) : (
            <p className="small text-body-secondary">
              No saved recommendations yet. Recommendations you make while signed in are stored here.
            </p>
          )}
        </Col>
        <Col lg={6}>
          <BatchUpload />
        </Col>
      </Row>

      {total > 0 && (
        <div>
          <Table responsive hover size="sm" className="align-middle">
            <caption className="visually-hidden">Saved recommendations</caption>
            <thead>
              <tr><th>When</th><th>N-P-K</th><th>pH</th><th>Rain</th><th>Top crop</th><th>Source</th></tr>
            </thead>
            <tbody>
              {recent.data.items.map((p) => (
                <tr key={p.id}>
                  <td className="text-nowrap text-body-secondary">{formatDateTime(p.created_at)}</td>
                  <td className="tabular">{p.N}-{p.P}-{p.K}</td>
                  <td className="tabular">{p.ph}</td>
                  <td className="tabular">{p.rainfall} mm</td>
                  <td>{formatCropName(p.top_crop)} ({formatPercent(p.confidence)})</td>
                  <td className="text-body-secondary">{p.source}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-between align-items-center small">
            <span className="text-body-secondary">
              Showing {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
            </span>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline-secondary" disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
