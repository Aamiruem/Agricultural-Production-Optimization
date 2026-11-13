import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { NumberField } from "@/components/common/NumberField";
import { recommendCrop } from "@/services/cropService";
import { useHistoryStore } from "@/store/historyStore";
import { SAMPLE_SOILS } from "@/utils/crops";
import { soilSchema } from "@/utils/validation";

import { RecommendationResults } from "./RecommendationResults";

const FIELDS = [
  { name: "N", label: "Nitrogen", unit: "N" },
  { name: "P", label: "Phosphorus", unit: "P" },
  { name: "K", label: "Potassium", unit: "K" },
  { name: "ph", label: "Soil pH", step: 0.1 },
  { name: "temperature", label: "Temperature", unit: "°C", step: 0.1 },
  { name: "humidity", label: "Humidity", unit: "%", step: 0.1 },
  { name: "rainfall", label: "Rainfall", unit: "mm", step: 0.1 },
];

export function CropRecommendForm() {
  const addToHistory = useHistoryStore((s) => s.add);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(soilSchema), mode: "onTouched" });

  // TanStack Query mutation → Axios POST → FastAPI → trained model
  const mutation = useMutation({
    mutationFn: recommendCrop,
    onSuccess: (result, soil) => {
      addToHistory(soil, result);
      queryClient.invalidateQueries({ queryKey: ["predictions"] }); // saved server-side when signed in
    },
  });

  return (
    <Row className="g-4">
      <Col lg={6}>
        <Card>
          <Card.Body>
            <Card.Title as="h2" className="h5">Soil &amp; climate readings</Card.Title>
            <p className="small text-body-secondary">Use values from your soil health card, or try a sample.</p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {SAMPLE_SOILS.map((s) => (
                <Button key={s.label} size="sm" variant="outline-secondary" onClick={() => reset(s.values)}>
                  {s.label}
                </Button>
              ))}
            </div>
            <form noValidate aria-label="Crop recommendation" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
              <Row xs={2} md={3} className="g-3">
                {FIELDS.map((f) => (
                  <Col key={f.name}>
                    <NumberField
                      id={`soil-${f.name}`}
                      label={f.label}
                      unit={f.unit}
                      step={f.step}
                      registration={register(f.name, { valueAsNumber: true })}
                      error={errors[f.name]}
                    />
                  </Col>
                ))}
              </Row>
              <Button type="submit" className="mt-3" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner size="sm" className="me-2" aria-hidden />}
                Recommend crops
              </Button>
            </form>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6} aria-live="polite">
        <ErrorAlert error={mutation.error} />
        {mutation.data && <RecommendationResults result={mutation.data} />}
        {mutation.isIdle && <EmptyState className="h-100 d-grid align-items-center">Your top three crops will appear here.</EmptyState>}
      </Col>
    </Row>
  );
}
