import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SEASONS } from "@/utils/crops";

export default function HomePage() {
  useDocumentTitle(null);
  return (
    <div className="d-grid gap-5">
      <Hero />
      <section aria-labelledby="features">
        <h2 id="features" className="h4 mb-3">What you can do</h2>
        <FeatureGrid />
      </section>
      <section aria-labelledby="seasons">
        <h2 id="seasons" className="h4 mb-3">Indian cropping seasons</h2>
        <Row as="dl" xs={1} sm={2} lg={4} className="g-3 mb-0">
          {SEASONS.map((s) => (
            <Col key={s.value}>
              <div className="border rounded p-3 bg-body h-100">
                <dt className="fw-semibold">{s.label}</dt>
                <dd className="small text-body-secondary mb-0">{s.months}</dd>
              </div>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
}
