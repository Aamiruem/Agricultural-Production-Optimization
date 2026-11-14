import { MessageCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Loader } from "@/components/common/Loader";
import { MIcon } from "@/components/common/MIcon";
import { useT } from "@/i18n/useT";
import { whatsappLink } from "@/data/site";
import { trackPageView } from "@/lib/analytics";

import { BOTTOM_LINKS } from "./navigation";
import { SideNav } from "./SideNav";
import { SiteFooter } from "./SiteFooter";
import { SiteNavbar } from "./SiteNavbar";

function AnnouncementBar() {
  const { t } = useT();
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem("agri-announce") === "hidden";
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <MIcon name="auto_awesome" size={18} fill />
      <span>{t("announce.text")}</span>
      <Link to="/agricultural-production-systems">{t("announce.cta")}</Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem("agri-announce", "hidden");
          } catch {
            /* storage unavailable */
          }
        }}
      >
        <MIcon name="close" size={18} />
      </button>
    </div>
  );
}

/** Mobile bottom navigation bar (Material 3 navigation bar). */
function BottomNav({ onMore }) {
  const { t } = useT();
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {BOTTOM_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end className={({ isActive }) => `bn-item${isActive ? " active" : ""}`}>
          <span className="bn-pill">
            <MIcon name={l.icon} size={24} fill />
          </span>
          <span className="bn-label">{t(l.key)}</span>
        </NavLink>
      ))}
      <button type="button" className="bn-item" onClick={onMore}>
        <span className="bn-pill">
          <MIcon name="more_horiz" size={24} />
        </span>
        <span className="bn-label">{t("nav.more")}</span>
      </button>
    </nav>
  );
}

export function MainLayout() {
  const { t } = useT();
  const { pathname, hash } = useLocation();
  const isHome = pathname === "/";
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 992px)").matches,
  );

  // Hash links (/#solutions) scroll to the section; other navigations start at the top.
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
    <>
      <a href="#main" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-sm btn-primary">
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteNavbar onMenuClick={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      <div className="app-shell">
        <SideNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-content">
          <main id="main">
            <div className={isHome ? "home-shell" : "page-shell"}>
              <ErrorBoundary key={pathname}>
                <Suspense
                  fallback={
                    // Viewport-tall so the footer does not jump when the page chunk arrives (CLS).
                    <div className="route-fallback">
                      <Loader label="Loading page" />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
      <a
        href={whatsappLink("Hello Aamir, I visited AgriSmart and would like to know more.")}
        className="fab-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with AgriSmart on WhatsApp"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </a>
      {pathname !== "/assistant" && (
        <Link to="/assistant" className="fab" aria-label={t("side.assistant")}>
          <MIcon name="auto_awesome" size={22} fill />
          <span>{t("nav.askAi")}</span>
        </Link>
      )}
      <BottomNav onMore={() => setSidebarOpen(true)} />
    </>
  );
}
