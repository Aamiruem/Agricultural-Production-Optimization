import "@/styles/public.scss";

import { MessageCircle } from "lucide-react";
import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { whatsappLink } from "@/data/site";
import { trackPageView } from "@/lib/analytics";
import { useSessionExpiry } from "@/store/authStore";

import { PublicNavbar } from "./PublicNavbar";
import { SiteFooter } from "./SiteFooter";

function PageSkeleton() {
  return (
    <div
      className="container-x"
      style={{ minHeight: "100vh", paddingBlock: "3rem" }}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--text" />
      <div className="skeleton skeleton--block" />
    </div>
  );
}

/** Public website shell: marketing navbar + footer. No sidebar or internal tools. */
export function PublicLayout() {
  const { pathname, hash } = useLocation();
  useSessionExpiry();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <div className="pub">
      <a href="#main" className="visually-hidden-focusable skip-link">
        Skip to content
      </a>
      <PublicNavbar />
      <main id="main">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter />
      <a
        href={whatsappLink("Hello Aamir, I visited AgriSmart and would like to know more.")}
        className="fab-whatsapp fab-whatsapp--public"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with AgriSmart on WhatsApp"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </a>
    </div>
  );
}
