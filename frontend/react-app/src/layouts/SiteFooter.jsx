import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { useT } from "@/i18n/useT";

import { FOOTER_TOOLS, TOP_LINKS } from "./navigation";

const SOCIAL = [
  { mark: "f", label: "Facebook", color: "#1877f2" },
  { mark: "X", label: "X / Twitter", color: "#0f172a" },
  { mark: "IG", label: "Instagram", color: "#e1306c" },
  { mark: "YT", label: "YouTube", color: "#ff0000" },
  { mark: "in", label: "LinkedIn", color: "#0a66c2" },
];

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand-link">
            <img src={logo} alt="" width="44" height="44" />
            <span className="brand-wordmark">
              <span>
                <b>Agri</b>
                <b>Smart</b>
              </span>
              <small>{t("brand.tagline")}</small>
            </span>
          </Link>
          <p>{t("footer.about")}</p>
          <div className="social-row" aria-label="Social links">
            {SOCIAL.map(({ mark, label, color }) => (
              <span key={label} className="social-icon" style={{ "--c": color }} title={label}>
                <span aria-hidden="true">{mark}</span>
                <span className="visually-hidden">{label}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3>{t("footer.nav")}</h3>
          <ul>
            {TOP_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{t(l.key)}</Link>
              </li>
            ))}
            <li>
              <Link to="/crops">{t("side.cropLibrary")}</Link>
            </li>
            <li>
              <Link to="/states">{t("side.stateGuide")}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3>{t("footer.solutions")}</h3>
          <ul>
            {FOOTER_TOOLS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{t(l.key)}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t("footer.contact")}</h3>
          <ul className="contact-list">
            <li>
              <Phone size={15} /> {t("footer.helpline")}: 1800-180-1551
            </li>
            <li>
              <Mail size={15} /> support@agrismart.app
            </li>
            <li>
              <MapPin size={15} /> India
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          &copy; {new Date().getFullYear()} AgriSmart. {t("footer.rights")}
        </span>
        <span>{t("footer.disclaimer")}</span>
      </div>
    </footer>
  );
}
