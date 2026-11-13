import { Headset } from "lucide-react";
import { Link, NavLink } from "react-router";

import { useT } from "@/i18n/useT";

import { NAV_GROUPS } from "./navigation";

export function SideNav({ open, onClose }) {
  const { t } = useT();
  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 991.98px)").matches) onClose();
  };
  return (
    <>
      <button className={`sidebar-backdrop${open ? " is-active" : ""}`} aria-label={t("nav.closeMenu")} onClick={onClose} tabIndex={open ? 0 : -1} />
      <aside id="app-sidebar" className={`side-nav${open ? " is-open" : " is-closed"}`} aria-label="Main navigation" aria-hidden={!open} inert={!open}>
        <nav className="side-nav-groups">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="side-nav-group">
              <div className="side-nav-group-label">{t(group.label)}</div>
              {group.links.map(({ to, key, icon: Icon, color }) => (
                <NavLink key={to} to={to} onClick={closeOnMobile} className={({ isActive }) => `side-nav-link${isActive ? " active" : ""}`} style={{ "--c": color }}>
                  <span className="side-icon"><Icon size={17} strokeWidth={2.2} aria-hidden="true" /></span>
                  <span>{t(key)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-nav-help">
          <Headset size={22} />
          <b>{t("side.helpTitle")}</b>
          <small>{t("side.helpText")}</small>
          <Link to="/assistant" className="btn btn-sm btn-cta mt-1" onClick={closeOnMobile}>{t("side.assistant")}</Link>
        </div>
      </aside>
    </>
  );
}
