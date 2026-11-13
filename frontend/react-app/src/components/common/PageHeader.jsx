import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Page heading that also sets the document title and meta description. */
export function PageHeader({ title, description }) {
  useDocumentTitle(title, description);
  return (
    <header className="mb-4">
      <h1 className="fw-bold h2 mb-1">{title}</h1>
      {description && <p className="text-body-secondary mb-0" style={{ maxWidth: "46rem" }}>{description}</p>}
    </header>
  );
}
