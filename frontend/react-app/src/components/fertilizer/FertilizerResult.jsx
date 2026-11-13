import { motion } from "framer-motion";
import Badge from "react-bootstrap/Badge";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";

import { formatCropName } from "@/utils/crops";

const NAMES = { N: "Nitrogen", P: "Phosphorus", K: "Potassium" };
const STATUS = { low: "danger", ok: "success", high: "warning" };

/** Nutrient gaps + DAP / Urea / MOP doses + advice. Reused by the farms page. */
export function FertilizerResult({ result, compact = false }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} aria-label="Fertilizer recommendation">
      {!compact && <h2 className="h5">{formatCropName(result.crop)} · {result.area_ha} ha</h2>}
      <Row xs={3} className="g-2 mb-3">
        {result.gaps.map((g) => (
          <Col key={g.nutrient}>
            <div className="border rounded p-2 h-100">
              <div className="small text-body-secondary">{NAMES[g.nutrient]}</div>
              <div className="fw-semibold tabular">
                {g.current} <span className="small fw-normal text-body-secondary">/ {g.target}</span>
              </div>
              <Badge bg={STATUS[g.status]}>{g.status}</Badge>
            </div>
          </Col>
        ))}
      </Row>
      {result.doses.length > 0 ? (
        <Table size="sm" bordered className="tabular">
          <thead>
            <tr><th>Fertilizer</th><th className="text-end">kg / ha</th><th className="text-end">Total kg</th></tr>
          </thead>
          <tbody>
            {result.doses.map((d) => (
              <tr key={d.product}>
                <td>{d.product}</td>
                <td className="text-end">{d.kg_per_ha}</td>
                <td className="text-end fw-semibold">{d.total_kg}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="small">No fertilizer needed for N, P and K.</p>
      )}
      <ul className="small text-body-secondary mb-0">
        {result.advice.map((a) => <li key={a}>{a}</li>)}
      </ul>
    </motion.section>
  );
}
