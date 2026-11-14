import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { fetchAdminUsers, reloadModel } from "@/services/mlService";
import { MODEL_NAMES } from "@/utils/crops";
import { formatDateTime } from "@/utils/format";

/** Admin-only (RBAC): user activity (SQL LEFT JOIN report) and model hot-reload. */
export default function AdminPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const reload = useMutation({
    mutationFn: reloadModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ml-model"] }),
  });

  return (
    <>
      <PageHeader title="Admin" description="Users and their activity, and the machine-learning model being served." />

      <section className="mb-5" aria-labelledby="model-admin">
        <h2 id="model-admin" className="h5">
          Served model
        </h2>
        <p className="small text-body-secondary">
          After retraining (<code>python -m AIML.machine_learning.crop_classifier</code>), reload the model without
          restarting the API.
        </p>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => reload.mutate()}
          disabled={reload.isPending}
          className="d-inline-flex align-items-center gap-1"
        >
          {reload.isPending ? <Spinner size="sm" /> : <RefreshCw size={14} />} Reload model
        </Button>
        <ErrorAlert error={reload.error} className="mt-2" />
        {reload.data && (
          <Alert variant="success" className="small mt-2 py-2">
            Now serving: {MODEL_NAMES[reload.data.model] ?? reload.data.method}
          </Alert>
        )}
      </section>

      <section aria-labelledby="users-admin">
        <h2 id="users-admin" className="h5">
          Users
        </h2>
        {users.isLoading && <Loader />}
        <ErrorAlert error={users.error} />
        {users.data && (
          <>
            <p className="small text-body-secondary">{users.data.total_predictions} predictions in total.</p>
            <Table responsive hover size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-end">Predictions</th>
                  <th>Last prediction</th>
                </tr>
              </thead>
              <tbody>
                {users.data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td className="text-capitalize">{u.role}</td>
                    <td className="text-end tabular">{u.predictions}</td>
                    <td className="text-body-secondary">
                      {u.last_prediction_at ? formatDateTime(u.last_prediction_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </section>
    </>
  );
}
