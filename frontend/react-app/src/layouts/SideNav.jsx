import { Link, NavLink } from "react-router";

import { MIcon } from "@/components/common/MIcon";
import { useT } from "@/i18n/useT";

import { NAV_GROUPS } from "./navigation";

/** Material 3 navigation drawer: pill active indicator, colourful icons. */
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
              {group.links.map(({ to, key, icon, color }) => (
                <NavLink key={to} to={to} onClick={closeOnMobile} className={({ isActive }) => `side-nav-link${isActive ? " active" : ""}`} style={{ "--c": color }}>
                  <MIcon name={icon} size={22} fill className="side-icon" />
                  <span>{t(key)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-nav-help">
          <MIcon name="support_agent" size={26} fill />
          <b>{t("side.helpTitle")}</b>
          <small>{t("side.helpText")}</small>
          <Link to="/assistant" className="btn btn-tonal btn-sm mt-1" onClick={closeOnMobile}><MIcon name="auto_awesome" size={18} /> {t("side.assistant")}</Link>
        </div>
      </aside>
    </>
  );
}
