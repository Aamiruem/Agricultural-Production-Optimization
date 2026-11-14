import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { useLiveRecommend } from "@/hooks/useLiveRecommend";
import { recommendLocal } from "@/lib/agriModels";
import { formatCropName } from "@/utils/crops";
import { formatPercent } from "@/utils/format";

const SLIDERS = [
  { key: "N", label: "Nitrogen", min: 0, max: 140, step: 1, unit: "" },
  { key: "P", label: "Phosphorus", min: 5, max: 145, step: 1, unit: "" },
  { key: "K", label: "Potassium", min: 5, max: 205, step: 1, unit: "" },
  { key: "ph", label: "pH", min: 3.5, max: 9.9, step: 0.1, unit: "" },
  { key: "temperature", label: "Temperature", min: 8, max: 44, step: 0.5, unit: "°C" },
  { key: "humidity", label: "Humidity", min: 14, max: 100, step: 1, unit: "%" },
  { key: "rainfall", label: "Rainfall", min: 20, max: 300, step: 5, unit: "mm" },
];

const START = { N: 80, P: 45, K: 40, temperature: 24, humidity: 80, ph: 6.5, rainfall: 200 };

/** Move a slider → the ranking updates instantly (WebSocket to the server model, or the in-browser model when offline). */
export function LiveWhatIf() {
  const [soil, setSoil] = useState(START);
  const live = useLiveRecommend(START);
  const { status, send } = live;
  // Without the API socket (e.g. static hosting), rank instantly with the browser model.
  const offline = status !== "open";
  const result = offline ? recommendLocal(soil) : live.result;

  const update = (key, value) => {
    const next = { ...soil, [key]: value };
    setSoil(next);
    send(next);
  };

  return (
    <Card className="mt-4">
      <Card.Body>
        <Card.Title as="h2" className="h5 d-flex align-items-center gap-2">
          Live what-if
          <Badge bg={offline ? "info" : "success"}>{offline ? "Browser model" : "Live"}</Badge>
        </Card.Title>
        <p className="small text-body-secondary">
          Move a slider and the ranking updates instantly (WebSocket to the server model, or the in-browser model when
          offline).
        </p>
        <Row className="g-4">
          <Col md={8}>
            <Row xs={1} sm={2} className="g-3">
              {SLIDERS.map((s) => (
                <Col key={s.key}>
                  <Form.Label htmlFor={`wi-${s.key}`} className="d-flex justify-content-between small mb-0">
                    <span>{s.label}</span>
                    <span className="tabular text-body-secondary">
                      {soil[s.key]}
                      {s.unit}
                    </span>
                  </Form.Label>
                  <Form.Range
                    id={`wi-${s.key}`}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={soil[s.key]}
                    onChange={(e) => update(s.key, Number(e.target.value))}
                  />
                </Col>
              ))}
            </Row>
          </Col>
          <Col md={4}>
            <ol className="list-unstyled d-grid gap-2 mb-0" aria-label="Live ranking" aria-live="polite">
              {result?.top.map((t, i) => (
                <li key={t.crop} className="d-flex justify-content-between border rounded px-3 py-2 small">
                  <span>
                    <span className="text-body-secondary">#{i + 1} </span>
                    {formatCropName(t.crop)}
                  </span>
                  <span className="tabular">{formatPercent(t.confidence)}</span>
                </li>
              ))}
              {!result && <li className="small text-body-secondary">Waiting for the API…</li>}
            </ol>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
