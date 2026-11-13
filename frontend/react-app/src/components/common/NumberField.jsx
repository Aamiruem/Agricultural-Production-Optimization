import Form from "react-bootstrap/Form";

/** Bootstrap number input wired to React Hook Form, with an accessible error message. */
export function NumberField({ id, label, unit, step = 1, registration, error }) {
  return (
    <Form.Group controlId={id}>
      <Form.Label className="small fw-medium mb-1">
        {label} {unit && <span className="text-body-secondary fw-normal">({unit})</span>}
      </Form.Label>
      <Form.Control
        type="number"
        inputMode="decimal"
        step={step}
        size="sm"
        isInvalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
      />
      {error && (
        <Form.Control.Feedback type="invalid" id={`${id}-error`} role="alert">
          {error.message}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
}
