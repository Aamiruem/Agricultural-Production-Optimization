import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Loader } from "@/components/common/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { FarmDetail } from "@/components/farms/FarmDetail";
import { FarmList } from "@/components/farms/FarmList";
import { NewFarmForm } from "@/components/farms/NewFarmForm";
import { useFarmSocket } from "@/hooks/useFarmSocket";
import { fetchFarms } from "@/services/farmService";
import { useSession } from "@/store/authStore";

export default function FarmsPage() {
  const { token } = useSession();
  const { connected, live } = useFarmSocket(token);
  const farms = useQuery({ queryKey: ["farms"], queryFn: fetchFarms, staleTime: 30_000 });
  const [selectedId, setSelectedId] = useState(null);
  const selected = farms.data?.find((f) => f._id === selectedId) ?? farms.data?.[0];

  return (
    <>
      <PageHeader
        title="Farms"
        description="Your farms, fields and activity log, saved to your account (Node.js + MongoDB). Changes appear live in every open tab."
      />
      <Row className="g-4">
        <Col lg={4}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="h6 mb-0">Your farms</h2>
            <Badge bg={connected ? "success" : "secondary"} title="Real-time updates (Socket.IO)">
              {connected ? "● Live" : "Offline"}
            </Badge>
          </div>
          {farms.isLoading && <Loader label="Loading farms" />}
          <ErrorAlert error={farms.error} />
          {farms.data && <FarmList farms={farms.data} selectedId={selected?._id} onSelect={setSelectedId} />}
          <NewFarmForm onCreated={setSelectedId} />
          {live.length > 0 && (
            <section aria-label="Live activity" className="mt-3">
              <h3 className="h6">Live activity</h3>
              <ul className="list-unstyled small text-body-secondary mb-0">
                {live.map((a) => (
                  <li key={a._id}>
                    <span className="fw-medium text-body text-capitalize">{a.type}</span> · {a.fieldName} ·{" "}
                    {new Date(a.date).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Col>
        <Col lg={8}>
          {selected ? (
            <FarmDetail key={selected._id} farmId={selected._id} />
          ) : (
            !farms.isLoading && <EmptyState>Create a farm to start adding fields.</EmptyState>
          )}
        </Col>
      </Row>
    </>
  );
}
