import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import { useDispatch, useSelector } from "react-redux";

import { EmptyState } from "@/components/common/EmptyState";
import { fieldRemoved, fieldsCleared, selectFields, statusAdvanced } from "@/store/fieldsSlice";
import { formatCropName, seasonLabel } from "@/utils/crops";

const STATUS_BG = { planned: "secondary", sown: "success", harvested: "warning" };

export function PlannerFieldList() {
  const fields = useSelector(selectFields);
  const dispatch = useDispatch();

  if (fields.length === 0) return <EmptyState>No fields yet. Add your first field to start planning.</EmptyState>;

  return (
    <section aria-labelledby="pl-fields">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 id="pl-fields" className="h5 mb-0">Your fields ({fields.length})</h2>
        <Button variant="link" size="sm" onClick={() => dispatch(fieldsCleared())}>Remove all</Button>
      </div>
      <ul className="list-unstyled d-grid gap-2 mb-0">
        <AnimatePresence initial={false}>
          {fields.map((f) => (
            <motion.li key={f.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, x: -20 }} className="card card-body py-2 d-flex flex-row align-items-center gap-3">
              <div className="flex-grow-1 min-w-0">
                <div className="fw-medium text-truncate">{f.name}</div>
                <div className="small text-body-secondary">
                  {formatCropName(f.crop)} · {f.areaHa} ha · {seasonLabel(f.season)}
                </div>
              </div>
              <Button variant="link" className="p-0" onClick={() => dispatch(statusAdvanced(f.id))}
                      aria-label={`Status: ${f.status}. Advance status of ${f.name}`} title="Click to advance status">
                <Badge bg={STATUS_BG[f.status]} className="text-capitalize">{f.status}</Badge>
              </Button>
              <Button variant="link" size="sm" className="text-body-secondary" onClick={() => dispatch(fieldRemoved(f.id))}
                      aria-label={`Remove ${f.name}`}>
                <Trash2 size={16} />
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
