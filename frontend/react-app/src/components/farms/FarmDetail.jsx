import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { FertilizerResult } from "@/components/fertilizer/FertilizerResult";
import { fetchFarmSummary, fetchFields } from "@/services/farmService";
import { formatCropName } from "@/utils/crops";
import { formatDate } from "@/utils/format";

import { FieldCard } from "./FieldCard";
import { NewFieldForm } from "./NewFieldForm";

export function FarmDetail({ farmId }) {
  const summary = useQuery({ queryKey: ["farm", farmId, "summary"], queryFn: () => fetchFarmSummary(farmId) });
  const fields = useQuery({ queryKey: ["farm", farmId, "fields"], queryFn: () => fetchFields(farmId) });
  const [plan, setPlan] = useState(null);
  const s = summary.data;

  if (summary.isLoading) return <Loader label="Loading farm" />;

  return (
    <section aria-label="Farm details" className="d-grid gap-3">
      <header className="d-flex flex-wrap justify-content-between align-items-baseline gap-2">
        <h2 className="h4 mb-0">{s?.farm.name}</h2>
        {s && (
          <span className="small text-body-secondary">
            {s.totals.fields} fields · {s.totals.areaHa.toFixed(1)} ha ·{" "}
            {Object.entries(s.byStatus).map(([k, v]) => `${v} ${k}`).join(" · ") || "no fields yet"}
          </span>
        )}
      </header>

      {s?.byCrop.length > 0 && (
        <div className="d-flex flex-wrap gap-2" aria-label="Area by crop">
          {s.byCrop.map((c) => (
            <Badge key={c.crop} bg="success-subtle" text="success-emphasis">
              {formatCropName(c.crop)} · {c.areaHa.toFixed(1)} ha
            </Badge>
          ))}
        </div>
      )}

      <ErrorAlert error={summary.error ?? fields.error} />

      <div className="d-grid gap-2">
        {fields.data?.map((field) => (
          <FieldCard key={field._id} field={field} onPlan={(f, result) => setPlan({ field: f, result })} />
        ))}
        {fields.data?.length === 0 && <EmptyState>No fields yet. Add one below.</EmptyState>}
      </div>

      <NewFieldForm farmId={farmId} />

      {s?.recentActivities.length > 0 && (
        <section aria-labelledby="activity-title">
          <h3 id="activity-title" className="h6">Recent activity</h3>
          <ListGroup variant="flush" className="border rounded small">
            {s.recentActivities.map((a) => (
              <ListGroup.Item key={a._id} className="d-flex flex-wrap gap-2">
                <span className="fw-medium text-capitalize">{a.type}</span>
                <span className="text-body-secondary">{a.fieldName}</span>
                {a.notes && <span className="text-truncate flex-grow-1">{a.notes}</span>}
                <time className="ms-auto text-body-secondary" dateTime={a.date}>{formatDate(a.date)}</time>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </section>
      )}

      <Modal show={Boolean(plan)} onHide={() => setPlan(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">Fertilizer plan · {plan?.field.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {plan && (
            <>
              <p className="small text-body-secondary">
                {formatCropName(plan.result.crop)} on {plan.result.area_ha} ha — calculated by the Python ML service.
              </p>
              <FertilizerResult result={plan.result} compact />
            </>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
}
