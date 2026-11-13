import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { NumberField } from "@/components/common/NumberField";
import { createField } from "@/services/farmService";
import { CROP_NAMES, formatCropName, SEASONS } from "@/utils/crops";
import { farmFieldSchema } from "@/utils/validation";

const DEFAULTS = { name: "", crop: "", season: "kharif" };

export function NewFieldForm({ farmId }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(farmFieldSchema), defaultValues: DEFAULTS });

  const mutation = useMutation({
    mutationFn: ({ N, P, K, ...field }) => {
      // Only send soil values that were actually entered.
      const soil = Object.fromEntries(Object.entries({ N, P, K }).filter(([, v]) => typeof v === "number" && !Number.isNaN(v)));
      return createField(farmId, { ...field, soil: Object.keys(soil).length ? soil : undefined });
    },
    onSuccess: () => {
      reset(DEFAULTS);
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });

  return (
    <Card>
      <Card.Body>
        <Card.Title as="h3" className="h6">Add a field</Card.Title>
        <form noValidate aria-label="Add field" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <Row xs={1} sm={2} lg={4} className="g-2">
            <Col>
              <Form.Group controlId="nf-name">
                <Form.Label className="small fw-medium mb-1">Field name</Form.Label>
                <Form.Control size="sm" isInvalid={Boolean(errors.name)} {...register("name")} />
                <Form.Control.Feedback type="invalid" role="alert">{errors.name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="nf-crop">
                <Form.Label className="small fw-medium mb-1">Crop</Form.Label>
                <Form.Select size="sm" isInvalid={Boolean(errors.crop)} {...register("crop")}>
                  <option value="">Choose…</option>
                  {CROP_NAMES.map((c) => <option key={c} value={c}>{formatCropName(c)}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid" role="alert">{errors.crop?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="nf-season">
                <Form.Label className="small fw-medium mb-1">Season</Form.Label>
                <Form.Select size="sm" {...register("season")}>
                  {SEASONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <NumberField id="nf-area" label="Area" unit="ha" step={0.1}
                           registration={register("areaHa", { valueAsNumber: true })} error={errors.areaHa} />
            </Col>
            {["N", "P", "K"].map((n) => (
              <Col key={n}>
                <NumberField id={`nf-${n}`} label={`Soil ${n}`} unit="optional"
                             registration={register(n, { valueAsNumber: true })} error={errors[n]} />
              </Col>
            ))}
            <Col className="d-flex align-items-end">
              <Button type="submit" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-1"
                      disabled={mutation.isPending}>
                <Plus size={16} /> Add field
              </Button>
            </Col>
          </Row>
          <ErrorAlert error={mutation.error} className="mt-2" />
        </form>
      </Card.Body>
    </Card>
  );
}
