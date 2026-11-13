import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SEASONS } from "@/utils/crops";
import { INDIA_CROPS } from "@/data/indiaCrops";
import { Link } from "react-router";

export default function HomePage() {
  useDocumentTitle(null);
  return (
    <div className="d-grid gap-5">
      <Hero />
      <section className="home-stats" aria-label="AgriOptima coverage">
        <div><strong>{INDIA_CROPS.length}</strong><span>crops to explore</span></div>
        <div><strong>8</strong><span>crop categories</span></div>
        <div><strong>28</strong><span>states represented</span></div>
        <div className="home-stat-note">State and soil examples are a starting point. Local crop advice varies by district.</div>
      </section>
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
      <section className="home-about-links"><div><h2 className="h5">Designed for local decisions</h2><p className="text-body-secondary mb-0">Explore Indian crop diversity, compare field inputs, and keep recommendations grounded in local soil tests.</p></div><div className="d-flex gap-3"><Link to="/about">About AgriOptima</Link><Link to="/contact">Contact</Link></div></section>
    </div>
  );
}
