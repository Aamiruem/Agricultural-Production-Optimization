import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { useDispatch } from "react-redux";

import { NumberField } from "@/components/common/NumberField";
import { fieldAdded } from "@/store/fieldsSlice";
import { CROP_NAMES, formatCropName, SEASONS } from "@/utils/crops";
import { plannerFieldSchema } from "@/utils/validation";

export function PlannerFieldForm() {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(plannerFieldSchema), defaultValues: { name: "", crop: "", season: "kharif" } });

  const onSubmit = (values) => {
    dispatch(fieldAdded(values)); // Redux Toolkit action
    reset({ name: "", crop: "", season: values.season });
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title as="h2" className="h5">
          Add a field
        </Card.Title>
        <p className="small text-body-secondary">Saved in this browser — no account needed.</p>
        <form noValidate aria-label="Add field" onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
          <Form.Group controlId="pl-name">
            <Form.Label className="small fw-medium mb-1">Field name</Form.Label>
            <Form.Control
              size="sm"
              placeholder="e.g. North plot"
              isInvalid={Boolean(errors.name)}
              {...register("name")}
            />
            <Form.Control.Feedback type="invalid" role="alert">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="pl-crop">
            <Form.Label className="small fw-medium mb-1">Crop</Form.Label>
            <Form.Select size="sm" isInvalid={Boolean(errors.crop)} {...register("crop")}>
              <option value="">Choose a crop…</option>
              {CROP_NAMES.map((c) => (
                <option key={c} value={c}>
                  {formatCropName(c)}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" role="alert">
              {errors.crop?.message}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="pl-season">
            <Form.Label className="small fw-medium mb-1">Season</Form.Label>
            <Form.Select size="sm" {...register("season")}>
              {SEASONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <NumberField
            id="pl-area"
            label="Area"
            unit="ha"
            step={0.1}
            registration={register("areaHa", { valueAsNumber: true })}
            error={errors.areaHa}
          />
          <Button type="submit" className="d-flex align-items-center justify-content-center gap-1">
            <Plus size={16} /> Add field
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
}
