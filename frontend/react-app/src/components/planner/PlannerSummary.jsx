import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useSelector } from "react-redux";

import { selectAreaBySeason, selectStatusCounts, selectTotalArea } from "@/store/fieldsSlice";
import { SEASONS } from "@/utils/crops";

export function PlannerSummary() {
  // Memoized Redux selectors
  const total = useSelector(selectTotalArea);
  const bySeason = useSelector(selectAreaBySeason);
  const counts = useSelector(selectStatusCounts);
  const tiles = [{ label: "Total area", value: total }, ...SEASONS.map((s) => ({ label: s.label, value: bySeason[s.value] ?? 0 }))];

  return (
    <section aria-label="Planner summary" className="mb-4">
      <Row xs={2} sm={3} md={5} className="g-2">
        {tiles.map((t) => (
          <Col key={t.label}>
            <div className="border rounded p-2 bg-body">
              <div className="small text-body-secondary">{t.label}</div>
              <div className="fw-semibold tabular">{t.value.toFixed(1)} ha</div>
            </div>
          </Col>
        ))}
      </Row>
      <p className="small text-body-secondary mt-2 mb-0">
        {counts.planned} planned · {counts.sown} sown · {counts.harvested} harvested
      </p>
    </section>
  );
}
