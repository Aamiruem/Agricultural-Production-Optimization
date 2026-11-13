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
import { createFarm } from "@/services/farmService";
import { farmSchema } from "@/utils/validation";

export function NewFarmForm({ onCreated }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(farmSchema) });

  const mutation = useMutation({
    mutationFn: createFarm,
    onSuccess: (farm) => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      onCreated(farm._id);
    },
  });

  return (
    <Card className="mt-3">
      <Card.Body>
        <Card.Title as="h3" className="h6">New farm</Card.Title>
        <form noValidate aria-label="New farm" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="d-grid gap-2">
          <Form.Group controlId="farm-name">
            <Form.Label className="small mb-1">Name</Form.Label>
            <Form.Control size="sm" placeholder="e.g. Green Acres" isInvalid={Boolean(errors.name)} {...register("name")} />
            <Form.Control.Feedback type="invalid" role="alert">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>
          <Row className="g-2">
            <Col>
              <Form.Group controlId="farm-district">
                <Form.Label className="small mb-1">District</Form.Label>
                <Form.Control size="sm" {...register("district")} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="farm-state">
                <Form.Label className="small mb-1">State</Form.Label>
                <Form.Control size="sm" {...register("state")} />
              </Form.Group>
            </Col>
          </Row>
          <ErrorAlert error={mutation.error} />
          <Button type="submit" size="sm" disabled={mutation.isPending} className="d-flex align-items-center justify-content-center gap-1">
            <Plus size={16} /> Add farm
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
}
