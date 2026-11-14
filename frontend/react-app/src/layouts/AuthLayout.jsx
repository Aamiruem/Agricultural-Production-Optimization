import { Suspense } from "react";
import Container from "react-bootstrap/Container";
import { Link, Outlet } from "react-router";

import logo from "@/assets/logo.svg";
import { Loader } from "@/components/common/Loader";

/** Minimal centred layout for sign-in and registration. */
export function AuthLayout() {
  return (
    <main id="main" className="auth-page d-flex flex-column justify-content-center py-5">
      <Container className="auth-container">
        <Link to="/" className="auth-brand d-flex align-items-center justify-content-center gap-3 mb-4 text-body">
          <img src={logo} alt="" width="48" height="48" />
          <span className="brand-wordmark">
            <span>
              <b>Agri</b>
              <b>Smart</b>
            </span>
            <small>Precision farming for a better tomorrow</small>
          </span>
        </Link>
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </Container>
    </main>
  );
}
