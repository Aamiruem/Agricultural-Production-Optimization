import "@/styles/public.scss";

import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";

import logo from "@/assets/logo.svg";
import { Loader } from "@/components/common/Loader";
import { photo } from "@/data/site";
import { useSession } from "@/store/authStore";
import { safeRedirect } from "@/utils/format";

const POINTS = [
  "Location-based weather, climate and soil analysis",
  "AI crop suitability and yield prediction",
  "Your farms and analyses saved to your account",
];

/** Split-screen layout for login, registration and password reset. */
export function AuthLayout() {
  const { user } = useSession();
  const { pathname, search } = useLocation();
  // Signed-in users skip login/register (password reset stays available).
  if (user && (pathname === "/login" || pathname === "/register")) {
    return <Navigate to={safeRedirect(new URLSearchParams(search).get("next"))} replace />;
  }
  const p = photo("machines/agricultural-drone");
  return (
    <div className="auth-shell">
      <aside className="auth-visual" aria-label="About AgriSmart">
        <img src={p.src} srcSet={p.srcSet} sizes="50vw" width="1200" height="800" alt="" />
        <Link
          to="/"
          className="pub-brand"
          style={{ color: "#fff", position: "absolute", top: "2rem", left: "clamp(1.5rem, 4vw, 3rem)" }}
        >
          <img src={logo} alt="" width="40" height="40" />
          <b>AgriSmart</b>
        </Link>
        <h2>Grow smarter. Farm better.</h2>
        <ul>
          {POINTS.map((t) => (
            <li key={t}>
              <CheckCircle2 size={18} aria-hidden="true" /> {t}
            </li>
          ))}
        </ul>
      </aside>
      <main id="main" className="auth-panel">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
        <p className="auth-alt" style={{ marginTop: "2rem" }}>
          <Link to="/">← Back to the AgriSmart website</Link>
        </p>
      </main>
    </div>
  );
}
