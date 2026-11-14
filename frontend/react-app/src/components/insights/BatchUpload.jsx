import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { uploadBatchCsv } from "@/services/cropService";
import { formatCropName } from "@/utils/crops";

/** CSV upload → background job (Celery) → many recommendations saved at once. */
export function BatchUpload() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const batch = useMutation({
    mutationFn: uploadBatchCsv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: ["prediction-stats"] });
    },
  });
  const job = batch.data;
  const topCrops = job?.result ? [...new Set(job.result.map((r) => formatCropName(r.top[0].crop)))].slice(0, 5) : [];

  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title as="h3" className="h6">
          Batch recommendations (CSV)
        </Card.Title>
        <p className="small text-body-secondary">
          Columns <code>N,P,K,temperature,humidity,ph,rainfall</code>, up to 1,000 rows. Processed as a background job.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label="CSV file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) batch.mutate(file);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline-primary"
          disabled={batch.isPending}
          onClick={() => fileRef.current?.click()}
          className="d-inline-flex align-items-center gap-1"
        >
          {batch.isPending ? <Spinner size="sm" /> : <Upload size={14} />} Upload CSV
        </Button>
        <ErrorAlert error={batch.error} className="mt-2" />
        {job && (
          <p className="small mt-2 mb-0" role="status">
            Job {job.id.slice(0, 8)} · <strong>{job.status}</strong> · {job.total_rows} rows
            {topCrops.length > 0 && ` · top crops: ${topCrops.join(", ")}`}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}
