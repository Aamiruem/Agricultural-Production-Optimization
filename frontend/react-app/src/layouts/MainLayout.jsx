import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Loader } from "@/components/common/Loader";
import { useSessionExpiry } from "@/store/authStore";

import { SiteFooter } from "./SiteFooter";
import { SiteNavbar } from "./SiteNavbar";

export function MainLayout() {
  const { pathname } = useLocation();
  useSessionExpiry();

  // Start each new page at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-sm btn-primary">
        Skip to content
      </a>
      <SiteNavbar />
      <main id="main">
        <div className="page-shell py-4 py-md-5">
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<Loader label="Loading page" />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
