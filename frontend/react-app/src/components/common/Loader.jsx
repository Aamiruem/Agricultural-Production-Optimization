// Plain markup with Bootstrap's CSS classes (no react-bootstrap JS on the public pages).
export function Loader({ label = "Loading" }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-body-secondary" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}
