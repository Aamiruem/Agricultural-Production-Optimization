import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import { Link, Outlet } from "react-router";

import logo from "@/assets/logo.svg";
import { Loader } from "@/components/common/Loader";

/** Minimal centred layout for sign-in and registration. */
export function AuthLayout() {
  return (
    <main id="main" className="d-flex flex-column justify-content-center py-5">
      <Container style={{ maxWidth: 420 }}>
        <Link to="/" className="d-flex align-items-center justify-content-center gap-2 mb-4 fs-5 fw-semibold text-body">
          <img src={logo} alt="" width="28" height="28" />
          AgriOptima
        </Link>
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Container>
    </main>
  );
}
