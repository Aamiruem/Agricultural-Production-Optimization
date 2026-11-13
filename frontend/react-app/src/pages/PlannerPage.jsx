import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { PageHeader } from "@/components/common/PageHeader";
import { PlannerFieldForm } from "@/components/planner/PlannerFieldForm";
import { PlannerFieldList } from "@/components/planner/PlannerFieldList";
import { PlannerSummary } from "@/components/planner/PlannerSummary";

export default function PlannerPage() {
  return (
    <>
      <PageHeader
        title="Quick planner"
        description="Plan fields offline in this browser. Click a status badge to move it from planned → sown → harvested. For synced farms, use Farms."
      />
      <Row className="g-4">
        <Col lg={4}><PlannerFieldForm /></Col>
        <Col lg={8}>
          <PlannerSummary />
          <PlannerFieldList />
        </Col>
      </Row>
    </>
  );
}
