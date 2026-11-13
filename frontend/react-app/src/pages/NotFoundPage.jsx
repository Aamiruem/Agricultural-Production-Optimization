import Button from "react-bootstrap/Button";
import { Link } from "react-router";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="text-center py-5">
      <h1 className="h2 fw-bold">Page not found</h1>
      <p className="text-body-secondary">This field is still fallow. Try one of these instead.</p>
      <div className="d-flex justify-content-center gap-2">
        <Button as={Link} to="/">Home</Button>
        <Button as={Link} to="/crops" variant="outline-secondary">Crop library</Button>
      </div>
    </div>
  );
}
