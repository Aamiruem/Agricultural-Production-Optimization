import { NavLink } from "react-router";

import { MIcon } from "@/components/common/MIcon";
import { useT } from "@/i18n/useT";

import { NAV_GROUPS, SECONDARY_LINKS } from "./navigation";

const MOBILE_QUERY = "(max-width: 991.98px)";

function DrawerLink({ to, label, icon, color, onNavigate }) {
  return (
    <NavLink to={to} onClick={onNavigate} className={({ isActive }) => `side-nav-link${isActive ? " active" : ""}`} style={{ "--c": color }}>
      <MIcon name={icon} size={22} fill className="side-icon" />
      <span>{label}</span>
    </NavLink>
  );
}

/** Material 3 navigation drawer: sections by farming stage, pill active indicator. */
export function SideNav({ open, onClose }) {
  const { t } = useT();
  const closeOnMobile = () => {
    if (window.matchMedia(MOBILE_QUERY).matches) onClose();
  };

  return (
    <>
      <button className={`sidebar-backdrop${open ? " is-active" : ""}`} aria-label={t("nav.closeMenu")} onClick={onClose} tabIndex={open ? 0 : -1} />
      <aside id="app-sidebar" className={`side-nav${open ? " is-open" : " is-closed"}`} aria-label="Main navigation" aria-hidden={!open} inert={!open}>
        <nav className="side-nav-groups">
          {NAV_GROUPS.map((group) => (
            <section key={group.id} className="side-nav-group" aria-labelledby={`nav-${group.id}`}>
              <h2 id={`nav-${group.id}`} className="side-nav-group-label">{t(group.label)}</h2>
              {group.links.map(({ to, key, icon, color }) => (
                <DrawerLink key={to} to={to} label={t(key)} icon={icon} color={color} onNavigate={closeOnMobile} />
              ))}
            </section>
          ))}
        </nav>

        <div className="side-nav-help">
          <MIcon name="support_agent" size={26} fill />
          <b>{t("side.helpTitle")}</b>
          <small>{t("side.helpText")}</small>
        </div>
        <ul className="side-nav-secondary">
          {SECONDARY_LINKS.map(({ to, key }) => (
            <li key={to}><NavLink to={to} onClick={closeOnMobile}>{t(key)}</NavLink></li>
          ))}
        </ul>
      </aside>
    </>
  );
}
