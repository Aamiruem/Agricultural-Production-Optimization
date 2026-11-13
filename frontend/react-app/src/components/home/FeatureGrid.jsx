import { Activity, Bot, Calculator, ChartColumn, CloudSun, Droplets, FlaskConical, LibraryBig, Map, ScanLine, Sprout, Tractor, TrendingUp } from "lucide-react";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { Link } from "react-router";

const FEATURES = [
  { to: "/dashboard", icon: Activity, title: "Farm dashboard", body: "Season overview, crop discovery and field planning at a glance." },
  { to: "/recommend", icon: Sprout, title: "Crop advisor", body: "Top-3 crops from the trained ML model, plus live what-if sliders." },
  { to: "/yield-prediction", icon: TrendingUp, title: "Yield outlook", body: "Explore field inputs and a clearly labeled planning range." },
  { to: "/soil-analysis", icon: FlaskConical, title: "Soil health", body: "Review NPK and pH readings from your soil test." },
  { to: "/weather", icon: CloudSun, title: "Weather watch", body: "Record local rainfall and humidity for field decisions." },
  { to: "/fertilizer", icon: Calculator, title: "Fertilizer calculator", body: "Nutrient gaps and DAP, Urea and MOP doses for your field size." },
  { to: "/crops", icon: LibraryBig, title: "Crop library", body: "Browse India crops by category, season, soil and leading states." },
  { to: "/irrigation-optimization", icon: Droplets, title: "Irrigation planner", body: "Estimate a seasonal water range for crop and field area." },
  { to: "/disease-detection", icon: ScanLine, title: "Crop health check", body: "Record symptoms and follow a safe field inspection checklist." },
  { to: "/reports", icon: ChartColumn, title: "Season reports", body: "Print a field summary and review sample production trends." },
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
