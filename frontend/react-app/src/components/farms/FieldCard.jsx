import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Camera, NotebookPen, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { deleteField, fieldFertilizerPlan, logActivity, uploadFieldPhoto } from "@/services/farmService";
import { formatCropName, seasonLabel } from "@/utils/crops";

const ACTIVITY_TYPES = ["sowing", "irrigation", "fertilizer", "pesticide", "harvest", "note"];

export function FieldCard({ field, onPlan }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [type, setType] = useState("irrigation");
  const [notes, setNotes] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["farm", field.farmId] });

  const plan = useMutation({
    mutationFn: () => fieldFertilizerPlan(field._id),
    onSuccess: (result) => onPlan(field, result),
  });
  const log = useMutation({
    mutationFn: () => logActivity(field._id, { type, notes: notes || undefined }),
    onSuccess: () => {
      setNotes("");
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: () => deleteField(field._id), onSuccess: refresh });
  const photo = useMutation({ mutationFn: (file) => uploadFieldPhoto(field._id, file), onSuccess: refresh });
  const error = [plan, log, remove, photo].find((m) => m.isError)?.error;
  const soil = field.soil ?? {};

  return (
    <Card as="article" aria-label={field.name}>
      <Card.Body className="py-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="flex-grow-1 min-w-0">
            <div className="fw-medium">{field.name}</div>
            <div className="small text-body-secondary">
              {formatCropName(field.crop)} · {field.areaHa} ha · {seasonLabel(field.season)}
              {soil.N !== undefined && ` · N-P-K ${soil.N}-${soil.P ?? "?"}-${soil.K ?? "?"}`}
            </div>
          </div>
          <Badge bg="light" text="dark" className="border text-capitalize">
            {field.status}
          </Badge>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => plan.mutate()}
            disabled={plan.isPending}
            className="d-flex align-items-center gap-1"
          >
            <Calculator size={14} /> Fertilizer plan
          </Button>
          <Button
            size="sm"
            variant="link"
            className="text-body-secondary"
            aria-label={`Upload photo of ${field.name}`}
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={16} />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) photo.mutate(file);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="link"
            className="text-body-secondary"
            aria-label={`Delete ${field.name}`}
            onClick={() => remove.mutate()}
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <form
          className="d-flex flex-wrap gap-2 mt-2"
          aria-label={`Log activity for ${field.name}`}
          onSubmit={(e) => {
            e.preventDefault();
            log.mutate();
          }}
        >
          <Form.Select
            size="sm"
            aria-label="Activity type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-capitalize"
            style={{ width: "auto" }}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Form.Select>
          <Form.Control
            size="sm"
            aria-label="Notes"
            placeholder="Notes (optional)"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-grow-1"
            style={{ minWidth: "10rem", width: "auto" }}
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={log.isPending}
            className="d-flex align-items-center gap-1"
          >
            <NotebookPen size={14} /> Log
          </Button>
        </form>

        {field.photos?.length > 0 && (
          <div className="d-flex gap-2 mt-2 overflow-auto">
            {field.photos.map((p) => (
              <img
                key={p.key}
                src={p.url}
                alt={`${field.name} photo`}
                width={64}
                height={64}
                className="rounded object-fit-cover"
              />
            ))}
          </div>
        )}
        <ErrorAlert error={error} className="mt-2" />
      </Card.Body>
    </Card>
  );
}
