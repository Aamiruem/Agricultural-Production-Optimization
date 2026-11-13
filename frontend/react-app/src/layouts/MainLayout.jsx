import { Megaphone, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Loader } from "@/components/common/Loader";
import { useT } from "@/i18n/useT";
import { trackPageView } from "@/lib/analytics";
import { useSessionExpiry } from "@/store/authStore";

import { SideNav } from "./SideNav";
import { SiteFooter } from "./SiteFooter";
import { SiteNavbar } from "./SiteNavbar";

function AnnouncementBar() {
  const { t } = useT();
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem("agri-announce") === "hidden"; } catch { return false; }
  });
  if (hidden) return null;
  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <Megaphone size={16} aria-hidden="true" />
      <span>{t("announce.text")}</span>
      <Link to="/dashboard">{t("announce.cta")} →</Link>
      <button type="button" aria-label="Dismiss announcement" onClick={() => {
        setHidden(true);
        try { sessionStorage.setItem("agri-announce", "hidden"); } catch { /* storage unavailable */ }
      }}><X size={15} /></button>
    </div>
  );
}

export function MainLayout() {
  const { pathname, hash } = useLocation();
  const isHome = pathname === "/";
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 992px)").matches);
  useSessionExpiry();

  // Hash links (/#solutions) scroll to the section; other navigations start at the top.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => { trackPageView(pathname); }, [pathname]);

  return (
    <>
      <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-sm btn-primary">Skip to content</a>
      <AnnouncementBar />
      <SiteNavbar onMenuClick={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      <div className="app-shell">
        <SideNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-content">
          <main id="main">
            <div className={isHome ? "home-shell" : "page-shell"}>
              <ErrorBoundary key={pathname}>
                <Suspense fallback={<Loader label="Loading page" />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
