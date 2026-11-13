import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { deleteFarm } from "@/services/farmService";

export function FarmList({ farms, selectedId, onSelect }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: deleteFarm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farms"] }),
  });

  if (farms.length === 0) return <p className="small text-body-secondary">No farms yet — add your first one.</p>;

  return (
    <>
      <ListGroup aria-label="Your farms">
        {farms.map((farm) => (
          <ListGroup.Item key={farm._id} active={farm._id === selectedId} className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-link text-start p-0 flex-grow-1 min-w-0 text-reset"
                    onClick={() => onSelect(farm._id)} aria-current={farm._id === selectedId}>
              <div className="fw-medium text-truncate">{farm.name}</div>
              <div className="small opacity-75">
                {[farm.location?.district, farm.location?.state].filter(Boolean).join(", ") || "No location"} ·{" "}
                {farm.fields ?? 0} fields · {(farm.areaHa ?? 0).toFixed(1)} ha
              </div>
            </button>
            <Button variant="link" size="sm" className="text-reset" aria-label={`Delete ${farm.name}`}
                    disabled={remove.isPending} onClick={() => remove.mutate(farm._id)}>
              <Trash2 size={16} />
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <ErrorAlert error={remove.error} className="mt-2" />
    </>
  );
}
