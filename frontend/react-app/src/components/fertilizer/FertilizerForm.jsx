import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { NumberField } from "@/components/common/NumberField";
import { getErrorMessage } from "@/services/apiClient";
import { fetchCrops, recommendFertilizer } from "@/services/cropService";
import { formatCropName } from "@/utils/crops";
import { fertilizerSchema } from "@/utils/validation";

import { FertilizerResult } from "./FertilizerResult";

const NUTRIENTS = { N: "Nitrogen", P: "Phosphorus", K: "Potassium" };

export function FertilizerForm() {
  // TanStack Query: crop list fetched once and cached.
  const crops = useQuery({ queryKey: ["crops"], queryFn: () => fetchCrops() });
  const mutation = useMutation({ mutationFn: recommendFertilizer });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(fertilizerSchema), defaultValues: { crop: "", area_ha: 1 }, mode: "onTouched" });

  return (
    <Row className="g-4">
      <Col lg={6}>
        <Card>
          <Card.Body>
            <Card.Title as="h2" className="h5">
              Field details
            </Card.Title>
            <p className="small text-body-secondary">Pick a crop and enter the soil N-P-K from your soil test.</p>
            <form
              noValidate
              aria-label="Fertilizer calculator"
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="d-grid gap-3"
            >
              <Form.Group controlId="fert-crop">
                <Form.Label className="small fw-medium mb-1">Crop</Form.Label>
                <Form.Select
                  size="sm"
                  isInvalid={Boolean(errors.crop)}
                  disabled={crops.isLoading || crops.isError}
                  {...register("crop")}
                >
                  <option value="">Choose a crop…</option>
                  {(crops.data ?? []).map((c) => (
                    <option key={c.name} value={c.name}>
                      {formatCropName(c.name)}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.crop?.message}</Form.Control.Feedback>
                {crops.isError && <div className="small text-danger mt-1">{getErrorMessage(crops.error)}</div>}
              </Form.Group>

              <Row xs={3} className="g-2">
                {Object.entries(NUTRIENTS).map(([key, label]) => (
                  <Col key={key}>
                    <NumberField
                      id={`fert-${key}`}
                      label={label}
                      unit="kg/ha"
                      registration={register(key, { valueAsNumber: true })}
                      error={errors[key]}
                    />
                  </Col>
                ))}
              </Row>

              <Controller
                name="area_ha"
                control={control}
                render={({ field }) => (
                  <Form.Group controlId="fert-area">
                    <Form.Label className="small fw-medium mb-0">
                      Field area: <span className="tabular">{field.value} ha</span>
                    </Form.Label>
                    <Form.Range
                      min={0.5}
                      max={50}
                      step={0.5}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      onBlur={field.onBlur}
                    />
                  </Form.Group>
                )}
              />

              <div>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Spinner size="sm" className="me-2" aria-hidden />}
                  Calculate doses
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6} aria-live="polite">
        <ErrorAlert error={mutation.error} />
        {mutation.data && <FertilizerResult result={mutation.data} />}
        {mutation.isIdle && (
          <EmptyState className="h-100 d-grid align-items-center">
            Nutrient gaps and fertilizer doses will appear here.
          </EmptyState>
        )}
      </Col>
    </Row>
  );
}
