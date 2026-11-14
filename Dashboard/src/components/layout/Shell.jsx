import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { cx } from "@/lib/cx.js";
import { Button, Icon, IconButton, StatusPill } from "@/components/ui/primitives.jsx";
import { useAuth } from "@/context/auth.js";
import { useTheme } from "@/context/theme.js";
import { breakerState } from "@/lib/api.js";
import { useSystemStatus } from "@/lib/queries.js";

import { NAV, titleFor } from "./navigation.js";

export function BrandMark({ size = 32 }) {
  return (
    <span className="relative grid place-items-center rounded-xl bg-surface-2" style={{ width: size, height: size }} aria-hidden>
      <Icon name="eco" size={size * 0.62} filled className="text-good" />
      <span className="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
        {["bg-brand-blue", "bg-brand-red", "bg-brand-yellow", "bg-brand-green"].map((c) => (
          <span key={c} className={cx("size-1.5 rounded-full", c)} />
        ))}
      </span>
    </span>
  );
}

function SideNav({ onNavigate }) {
  const sections = [...new Set(NAV.map((n) => n.section))];
  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section}>
          <p className="px-4 pb-1 text-[11px] font-medium tracking-wider text-ink-3 uppercase">{section}</p>
          <ul className="flex flex-col gap-0.5">
            {NAV.filter((n) => n.section === section).map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) => cx(
                    "flex h-10 items-center gap-3 rounded-full px-4 text-sm font-medium transition",
                    isActive ? "bg-primary-soft text-on-primary-soft" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <Icon name={n.icon} size={20} filled={isActive} />
                      {n.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme();
  const next = { system: "light", light: "dark", dark: "system" }[preference] ?? "system";
  return (
    <IconButton
      icon={resolved === "dark" ? "dark_mode" : "light_mode"}
      label={`Theme: ${preference}. Switch to ${next}`}
      onClick={() => setPreference(next)}
    />
  );
}

function useBreakerTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("api:breaker", on);
    return () => window.removeEventListener("api:breaker", on);
  }, []);
}

function Connectivity() {
  useBreakerTick();
  const { data, isError } = useSystemStatus();
  const open = breakerState("api") === "open";
  const status = open || isError ? "down" : data?.status ?? "unknown";
  const label = { ok: "All systems normal", degraded: "Partially degraded", down: "API unreachable", unknown: "Connecting…" }[status];
  return (
    <Link to="/system" className="hidden sm:block" aria-label={`Platform status: ${label}`}>
      <StatusPill status={status} label={label} />
    </Link>
  );
}

function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    return <Button variant="tonal" icon="login" size="sm" onClick={() => navigate("/login")}>Sign in</Button>;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right leading-tight md:block">
        <span className="block text-[13px] font-medium text-ink">{user.full_name}</span>
        <span className="block text-[11px] text-ink-3">{user.role}</span>
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-medium text-on-primary" aria-hidden>
        {user.full_name?.[0]?.toUpperCase() ?? "U"}
      </span>
      <IconButton icon="logout" label="Sign out" onClick={signOut} />
    </div>
  );
}

export function Shell() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const title = titleFor(pathname);

  useEffect(() => {
    document.title = `${title} · AgriSmart Console`;
  }, [title]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Skip to content
      </a>

      {/* Sidebar: fixed on desktop, drawer on small screens */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-68 flex-col gap-6 overflow-y-auto border-r border-outline bg-surface px-3 py-4 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <BrandMark />
            <span className="leading-tight">
              <span className="block text-[17px] font-medium text-ink">AgriSmart</span>
              <span className="block text-[11px] text-ink-3">Operations console</span>
            </span>
          </Link>
          <IconButton icon="close" label="Close menu" className="lg:hidden" onClick={() => setOpen(false)} />
        </div>
        <SideNav onNavigate={() => setOpen(false)} />
        <div className="mt-auto rounded-2xl bg-surface-2 p-4 text-[12.5px] text-ink-2">
          <p className="flex items-center gap-1.5 font-medium text-ink"><Icon name="verified" size={18} className="text-good" /> Live models</p>
          <p className="mt-1">Random Forest crop recommender with TreeSHAP explanations · XGBoost yield regression.</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="lg:pl-68">
        <header
          className="sticky z-20 flex h-16 items-center gap-2 border-b border-outline bg-bg/90 px-4 backdrop-blur sm:px-6"
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <IconButton icon="menu" label="Open menu" className="lg:hidden" onClick={() => setOpen(true)} />
          <h1 className="min-w-0 flex-1 truncate text-[20px] font-normal text-ink">{title}</h1>
          <Connectivity />
          <ThemeToggle />
          <Account />
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
