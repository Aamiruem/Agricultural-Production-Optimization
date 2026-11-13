import { Bot, Calculator, ChartColumn, LibraryBig, Map, Sprout, Tractor } from "lucide-react";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { Link } from "react-router";

const FEATURES = [
  { to: "/recommend", icon: Sprout, title: "Crop advisor", body: "Top-3 crops from the trained ML model, plus live what-if sliders." },
  { to: "/fertilizer", icon: Calculator, title: "Fertilizer calculator", body: "Nutrient gaps and DAP, Urea and MOP doses for your field size." },
  { to: "/crops", icon: LibraryBig, title: "Crop library", body: "Ideal growing conditions for 22 crops grown in India." },
  { to: "/farms", icon: Tractor, title: "Farms", body: "Farms, fields and activity logs with live updates and photos." },
  { to: "/planner", icon: Map, title: "Quick planner", body: "Plan fields offline in your browser — no account needed." },
  { to: "/assistant", icon: Bot, title: "AI assistant", body: "Ask farming questions; answers cite the knowledge base." },
  { to: "/insights", icon: ChartColumn, title: "Insights", body: "Model comparison, feature importance and your history." },
];

export function FeatureGrid() {
  return (
    <Row xs={1} sm={2} lg={4} className="g-3">
      {FEATURES.map(({ to, icon: Icon, title, body }) => (
        <Col key={to}>
          <Card as={Link} to={to} className="h-100 card-hover text-body">
            <Card.Body>
              <Icon className="text-primary mb-2" size={24} aria-hidden />
              <Card.Title as="h3" className="h6 fw-semibold">{title}</Card.Title>
              <Card.Text className="small text-body-secondary">{body}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
