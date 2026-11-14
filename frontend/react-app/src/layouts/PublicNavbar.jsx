import { LayoutDashboard, LogIn, LogOut, Menu, Moon, Settings, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

import logo from "@/assets/logo.svg";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore, useSession } from "@/store/authStore";

import { PUBLIC_LINKS } from "./navigation";

/** Is this public link the current page? Hash links match only on the home page with that hash. */
function useIsActive() {
  const { pathname, hash } = useLocation();
  return (to) => {
    const [path, h] = to.split("#");
    if (h) return pathname === (path || "/") && hash === `#${h}`;
    return to === "/" ? pathname === "/" && !hash : pathname === to || pathname.startsWith(`${to}/`);
  };
}

function initialsOf(user) {
  return (user?.full_name || user?.email || "U")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Public website navigation: sticky, translucent, keyboard and screen-reader friendly. */
export function PublicNavbar() {
  const { user } = useSession();
  const logout = useAuthStore((s) => s.logout);
  const { mode, toggle } = useTheme();
  const isActive = useIsActive();
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Close menus on navigation.
  const [lastLoc, setLastLoc] = useState(`${pathname}${hash}`);
  if (lastLoc !== `${pathname}${hash}`) {
    setLastLoc(`${pathname}${hash}`);
    setOpen(false);
    setMenu(false);
  }
  useEffect(() => {
    if (!open && !menu) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMenu(false);
      }
    };
    const onClick = (e) => {
      if (menu && menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = "";
    };
  }, [open, menu]);

  const linkProps = (to) => ({ "aria-current": isActive(to) ? "page" : undefined });

  return (
    <header className={`pub-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="container-x pub-nav-row">
        <Link to="/" className="pub-brand" aria-label="AgriSmart home">
          <img src={logo} alt="" width="40" height="40" />
          <b>
            Agri<span>Smart</span>
          </b>
        </Link>

        <nav aria-label="Primary">
          <ul className="pub-links">
            {PUBLIC_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} {...linkProps(l.to)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pub-actions">
          <button
            type="button"
            className="pub-icon-btn hide-mobile"
            onClick={toggle}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {mode === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          {user ? (
            <>
              <Link to="/dashboard" className="btn-x btn-x--primary btn-x--sm hide-mobile">
                <LayoutDashboard size={17} aria-hidden="true" /> Dashboard
              </Link>
              <div className="pub-user hide-mobile" ref={menuRef}>
                <button
                  type="button"
                  className="pub-avatar"
                  aria-haspopup="menu"
                  aria-expanded={menu}
                  aria-label="Account menu"
                  onClick={() => setMenu((m) => !m)}
                >
                  {initialsOf(user)}
                </button>
                {menu && (
                  <div className="pub-menu" role="menu">
                    <p>
                      <b>{user.full_name}</b>
                      {user.email}
                    </p>
                    <Link to="/dashboard" role="menuitem">
                      <LayoutDashboard size={17} aria-hidden="true" /> Dashboard
                    </Link>
                    <Link to="/settings" role="menuitem">
                      <Settings size={17} aria-hidden="true" /> Profile &amp; settings
                    </Link>
                    <button type="button" role="menuitem" onClick={logout}>
                      <LogOut size={17} aria-hidden="true" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-x btn-x--secondary btn-x--sm hide-mobile">
                <LogIn size={17} aria-hidden="true" /> Login
              </Link>
              <Link to="/register" className="btn-x btn-x--primary btn-x--sm hide-mobile">
                Get Started
              </Link>
            </>
          )}
          <button
            type="button"
            className="pub-icon-btn pub-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="pub-drawer"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div id="pub-drawer" className={`pub-drawer${open ? " is-open" : ""}`} inert={!open}>
        <nav aria-label="Mobile">
          <ul>
            {PUBLIC_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} {...linkProps(l.to)}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <NavLink to="/features">All features</NavLink>
            </li>
          </ul>
        </nav>
        <div className="pub-drawer-cta">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-x btn-x--primary">
                <LayoutDashboard size={18} aria-hidden="true" /> Open dashboard
              </Link>
              <button type="button" className="btn-x btn-x--secondary" onClick={logout}>
                <LogOut size={18} aria-hidden="true" /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-x btn-x--primary">
                Get Started — it&apos;s free
              </Link>
              <Link to="/login" className="btn-x btn-x--secondary">
                <LogIn size={18} aria-hidden="true" /> Login
              </Link>
            </>
          )}
          <button type="button" className="btn-x btn-x--text" onClick={toggle}>
            {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />} {mode === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>
    </header>
  );
}
