import Spinner from "react-bootstrap/Spinner";

export function Loader({ label = "Loading" }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-body-secondary" role="status">
      <Spinner animation="border" size="sm" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}
