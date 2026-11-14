import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { Link, useParams } from "react-router";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { fetchCrop } from "@/services/cropService";
import { formatCropName, seasonLabel } from "@/utils/crops";

import NotFoundPage from "./NotFoundPage";

export default function CropDetailPage() {
  const { name } = useParams();
  const crop = useQuery({ queryKey: ["crop", name], queryFn: () => fetchCrop(name), retry: false });

  if (crop.error instanceof AxiosError && crop.error.response?.status === 404) return <NotFoundPage />;

  const c = crop.data;
  const stats = c && [
    { label: "Nitrogen (N)", value: c.N },
    { label: "Phosphorus (P)", value: c.P },
    { label: "Potassium (K)", value: c.K },
    { label: "Soil pH", value: c.ph },
    { label: "Temperature", value: `${c.temperature} °C` },
    { label: "Humidity", value: `${c.humidity} %` },
    { label: "Rainfall", value: `${c.rainfall} mm` },
  ];

  return (
    <>
      <Button
        as={Link}
        to="/crops"
        variant="link"
        size="sm"
        className="ps-0 mb-3 d-inline-flex align-items-center gap-1"
      >
        <ArrowLeft size={14} /> All crops
      </Button>
      <PageHeader
        title={formatCropName(name)}
        description={`Average conditions where ${formatCropName(name).toLowerCase()} grows well.`}
      />
      {crop.isLoading && <Loader />}
      <ErrorAlert error={crop.error} />
      {c && (
        <>
          <div className="d-flex gap-2 mb-3">
            <Badge bg="success">{seasonLabel(c.season)}</Badge>
            <Badge bg="secondary-subtle" text="secondary-emphasis" className="text-capitalize">
              {c.category}
            </Badge>
          </div>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title as="h2" className="h6">
                Ideal growing conditions
              </Card.Title>
              <Row as="dl" xs={2} md={4} className="g-3 mb-0">
                {stats.map((s) => (
                  <Col key={s.label}>
                    <dt className="small text-body-secondary fw-normal">{s.label}</dt>
                    <dd className="fs-5 fw-semibold tabular mb-0">{s.value}</dd>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
          <Button as={Link} to="/fertilizer">
            Plan fertilizer for {formatCropName(c.name).toLowerCase()}
          </Button>
        </>
      )}
    </>
  );
}
