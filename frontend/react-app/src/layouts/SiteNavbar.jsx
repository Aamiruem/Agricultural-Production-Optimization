import { useMemo, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { MIcon } from "@/components/common/MIcon";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/i18n/useT";
import { seasonalNotifications } from "@/lib/notifications";
import { useAuthStore, useSession } from "@/store/authStore";

const READ_KEY = "agri-notifications-read";

/** Google-style top app bar: search pill, actions, and tabs for the primary links. */
export function SiteNavbar({ onMenuClick, sidebarOpen }) {
  const { mode, toggle } = useTheme();
  const { t, lang, setLang } = useT();
  const { user, isAdmin } = useSession();
  const logout = useAuthStore((st) => st.logout);
  const initials = (user?.full_name || user?.email || "U")
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [searchOpen, setSearchOpen] = useState(false);
  const notifications = useMemo(() => seasonalNotifications(new Date().getMonth(), lang), [lang]);
  const [read, setRead] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const unread = notifications.filter((n) => !read.includes(n.id)).length;
  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    setRead(ids);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <header className="app-bar">
      <div className={`app-bar-row${searchOpen ? " search-mode" : ""}`}>
        <button
          type="button"
          className="icon-btn"
          onClick={onMenuClick}
          aria-label={sidebarOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
        >
          <MIcon name="menu" />
        </button>
        <Link to="/dashboard" className="brand-link" aria-label="AgriSmart dashboard">
          <img src={logo} alt="" width="40" height="40" className="brand-mark" />
          <span className="brand-wordmark">
            <span>
              <b>Agri</b>
              <b>Smart</b>
            </span>
            <small>{t("brand.tagline")}</small>
          </span>
        </Link>

        <div className="app-bar-search">
          <GlobalSearch autoFocus={searchOpen} onDone={() => setSearchOpen(false)} />
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn search-toggle"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={t("common.search")}
          >
            <MIcon name={searchOpen ? "close" : "search"} />
          </button>
          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              type="button"
              className="icon-btn no-caret"
              aria-label={`${t("nav.notifications")} (${unread})`}
            >
              <MIcon name="notifications" />
              {unread > 0 && <span className="notif-dot">{unread}</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="g-menu notif-menu">
              <div className="g-menu-head">
                <b>{t("nav.notifications")}</b>
                {unread > 0 && (
                  <button type="button" className="g-text-btn" onClick={markAllRead}>
                    {lang === "hi" ? "सभी पढ़ा" : "Mark all read"}
                  </button>
                )}
              </div>
              {notifications.map(({ id, icon, color, title, body, to }) => (
                <Dropdown.Item as={Link} to={to} key={id} className={`notif-item${read.includes(id) ? "" : " unread"}`}>
                  <span className="icon-badge sm" style={{ "--c": color }}>
                    <MIcon name={icon} size={18} fill />
                  </span>
                  <span>
                    <b>{title}</b>
                    <small>{body}</small>
                  </span>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <label className="lang-switch" title={t("nav.language")}>
            <MIcon name="translate" size={20} />
            <select aria-label={t("nav.language")} value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="hi">हिं</option>
            </select>
          </label>

          <button
            type="button"
            className="icon-btn theme-btn"
            onClick={toggle}
            aria-label={t("nav.theme")}
            title={t("nav.theme")}
          >
            <MIcon name={mode === "dark" ? "light_mode" : "dark_mode"} />
          </button>

          <Dropdown align="end">
            <Dropdown.Toggle as="button" type="button" className="avatar-btn no-caret" aria-label={t("nav.profile")}>
              <span className="avatar">{initials}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="g-menu profile-menu">
              <div className="profile-head">
                <span className="avatar lg">{initials}</span>
                <b>
                  {lang === "hi" ? "नमस्ते" : "Hi"}, {user?.full_name?.split(" ")[0] || "Farmer"}!
                </b>
                <small>{user?.email}</small>
              </div>
              <Dropdown.Item as={Link} to="/settings">
                <MIcon name="account_circle" size={20} /> {t("side.settings")}
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/farms">
                <MIcon name="agriculture" size={20} /> {t("nav.myFarms")}
              </Dropdown.Item>
              {isAdmin && (
                <Dropdown.Item as={Link} to="/admin">
                  <MIcon name="admin_panel_settings" size={20} /> {t("nav.admin")}
                </Dropdown.Item>
              )}
              <Dropdown.Item as={Link} to="/">
                <MIcon name="home" size={20} /> {t("side.publicSite")}
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={logout}>
                <MIcon name="logout" size={20} /> {t("nav.signOut")}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
