import Container from "react-bootstrap/Container";

export function SiteFooter() {
  return (
    <footer className="border-top py-4 small text-body-secondary">
      <Container className="d-flex flex-wrap justify-content-between gap-2">
        <span>© {new Date().getFullYear()} AgriSmart</span>
        <span>Recommendations are planning estimates — confirm with a soil test and your local Krishi Vigyan Kendra.</span>
      </Container>
    </footer>
  );
}
