import Alert from "react-bootstrap/Alert";

import { getErrorMessage } from "@/services/apiClient";

/** Shows an API error (or any Error) as a readable alert. Renders nothing without an error. */
export function ErrorAlert({ error, className = "" }) {
  if (!error) return null;
  return (
    <Alert variant="danger" className={`py-2 small mb-0 ${className}`} role="alert">
      {typeof error === "string" ? error : getErrorMessage(error)}
    </Alert>
  );
}
