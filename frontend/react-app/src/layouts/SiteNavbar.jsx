import { Bell, CalendarDays, CloudRain, FlaskConical, Languages, LogOut, Menu, Moon, Shield, Sun, Tractor, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Navbar from "react-bootstrap/Navbar";
import { Link, NavLink } from "react-router";

import logo from "@/assets/logo.svg";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/i18n/useT";
import { useAuthStore, useSession } from "@/store/authStore";

import { TOP_LINKS } from "./navigation";

const READ_KEY = "agri-notifications-read";

/** Season-aware notifications computed from today's date. */
function useNotifications(lang) {
  return useMemo(() => {
    const m = new Date().getMonth(); // 0 = Jan
    const hi = lang === "hi";
    const items = [];
    if (m >= 9 || m <= 0) items.push({ id: `rabi-${m}`, icon: CalendarDays, color: "#0284c7", to: "/crops",
      title: hi ? "रबी बुवाई का समय" : "Rabi sowing window", body: hi ? "गेहूँ, चना, सरसों की बुवाई अक्टूबर–दिसंबर।" : "Wheat, chickpea and mustard: sow Oct – Dec." });
    if (m >= 5 && m <= 7) items.push({ id: `kharif-${m}`, icon: CloudRain, color: "#16a34a", to: "/crops",
      title: hi ? "खरीफ बुवाई का समय" : "Kharif sowing window", body: hi ? "मानसून के साथ धान, कपास, सोयाबीन की बुवाई।" : "Sow rice, cotton and soybean with the monsoon." });
    if (m >= 2 && m <= 4) items.push({ id: `zaid-${m}`, icon: Sun, color: "#ea580c", to: "/irrigation-optimization",
      title: hi ? "ज़ायद फसल और गर्मी" : "Zaid crops & heat", body: hi ? "मूंग, तरबूज के लिए सिंचाई योजना बनाएँ।" : "Plan irrigation for moong, melons and fodder." });
    items.push({ id: "weather", icon: CloudRain, color: "#0ea5e9", to: "/weather",
      title: hi ? "छिड़काव से पहले मौसम देखें" : "Check weather before spraying", body: hi ? "बारिश या तेज़ हवा में छिड़काव न करें।" : "Avoid spraying before rain or in strong wind." });
    items.push({ id: "soil", icon: FlaskConical, color: "#a16207", to: "/soil-analysis",
      title: hi ? "मिट्टी परीक्षण अनुस्मारक" : "Soil test reminder", body: hi ? "हर 2–3 साल में मृदा स्वास्थ्य कार्ड अपडेट करें।" : "Update your Soil Health Card every 2–3 years." });
    return items;
  }, [lang]);
}

export function SiteNavbar({ onMenuClick, sidebarOpen }) {
  const { mode, toggle } = useTheme();
  const { t, lang, setLang } = useT();
  const { user, isAdmin } = useSession();
  const logout = useAuthStore((s) => s.logout);
  const [expanded, setExpanded] = useState(false);
  const notifications = useNotifications(lang);
  const [read, setRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch { return []; }
  });
  const unread = notifications.filter((n) => !read.includes(n.id)).length;
  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    setRead(ids);
    try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
  };
  const close = () => setExpanded(false);
  const initials = (user?.full_name || user?.email || "U").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Navbar expand="xl" sticky="top" className="navbar-agri" expanded={expanded} onToggle={setExpanded}>
      <div className="navbar-inner">
        <Button variant="link" className="icon-btn side-menu-trigger" onClick={onMenuClick}
          aria-label={sidebarOpen ? t("nav.closeMenu") : t("nav.openMenu")} aria-expanded={sidebarOpen} aria-controls="app-sidebar">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </Button>
        <Navbar.Brand as={Link} to="/" onClick={close} className="brand-link">
          <img src={logo} alt="" width="44" height="44" className="brand-mark" />
          <span className="brand-wordmark"><span><b>Agri</b><b>Smart</b></span><small>{t("brand.tagline")}</small></span>
        </Navbar.Brand>

        <Navbar.Collapse id="main-nav" className="top-links-collapse">
          <nav className="top-links" aria-label="Primary">
            {TOP_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end onClick={close} className={({ isActive }) => `top-link${isActive && !l.to.includes("#") ? " active" : ""}`}>{t(l.key)}</NavLink>
            ))}
          </nav>
          {!user && <div className="mobile-auth"><Link to="/login" onClick={close} className="btn btn-outline-success">{t("nav.login")}</Link><Link to="/register" onClick={close} className="btn btn-cta">{t("nav.register")}</Link></div>}
        </Navbar.Collapse>

        <div className="nav-actions">
          <Dropdown align="end">
            <Dropdown.Toggle as={Button} variant="link" className="icon-btn no-caret" aria-label={`${t("nav.notifications")} (${unread})`}>
              <Bell size={19} />{unread > 0 && <span className="notif-dot">{unread}</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="notif-menu">
              <div className="notif-head"><b>{t("nav.notifications")}</b>{unread > 0 && <button type="button" onClick={markAllRead}>{lang === "hi" ? "सभी पढ़ा" : "Mark all read"}</button>}</div>
              {notifications.map(({ id, icon: Icon, color, title, body, to }) => (
                <Dropdown.Item as={Link} to={to} key={id} className={`notif-item${read.includes(id) ? "" : " unread"}`}>
                  <span className="icon-badge" style={{ "--c": color }}><Icon size={16} /></span>
                  <span><b>{title}</b><small>{body}</small></span>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <label className="lang-switch" title={t("nav.language")}>
            <Languages size={16} aria-hidden="true" />
            <select aria-label={t("nav.language")} value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="hi">हिं</option>
            </select>
          </label>

          <Button variant="link" className="icon-btn" onClick={toggle} aria-label={t("nav.theme")} title={t("nav.theme")}>
            {mode === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </Button>

          {user ? (
            <Dropdown align="end">
              <Dropdown.Toggle as={Button} variant="link" className="profile-toggle no-caret" aria-label={t("nav.profile")}>
                <span className="avatar">{initials}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="profile-menu">
                <div className="profile-head"><span className="avatar lg">{initials}</span><span><b>{user.full_name || "Farmer"}</b><small>{user.email}</small></span></div>
                <Dropdown.Item as={Link} to="/farms"><Tractor size={16} /> {t("nav.myFarms")}</Dropdown.Item>
                <Dropdown.Item as={Link} to="/dashboard"><UserRound size={16} /> {t("nav.profile")}</Dropdown.Item>
                {isAdmin && <Dropdown.Item as={Link} to="/admin"><Shield size={16} /> {t("nav.admin")}</Dropdown.Item>}
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout}><LogOut size={16} /> {t("nav.signOut")}</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <div className="auth-buttons">
              <Button as={Link} to="/login" variant="link" className="login-link">{t("nav.login")}</Button>
              <Button as={Link} to="/register" className="btn-cta">{t("nav.start")}</Button>
            </div>
          )}
          <Navbar.Toggle aria-controls="main-nav" className="top-toggle" />
        </div>
      </div>
    </Navbar>
  );
}
