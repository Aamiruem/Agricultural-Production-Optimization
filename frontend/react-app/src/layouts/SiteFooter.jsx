import { ArrowUp, Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { GithubIcon, LinkedinIcon } from "@/components/site/SiteKit";
import { BRAND, OWNER, whatsappLink } from "@/data/site";
import { useSession } from "@/store/authStore";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/features", label: "Features" },
      { to: "/ai-in-agriculture", label: "AI Solutions" },
      { to: "/#how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Agricultural Solutions",
    links: [
      { to: "/ai-in-agriculture#crop-yield-prediction", label: "Crop Prediction" },
      { to: "/ai-in-agriculture#soil-nutrient-analysis", label: "Soil Intelligence" },
      { to: "/ai-in-agriculture#weather-forecasting", label: "Weather Analysis" },
      { to: "/agricultural-production-systems/precision-agriculture", label: "Smart Farming" },
      { to: "/features#data", label: "Agricultural Data" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: "/agricultural-production-systems", label: "Production systems" },
      { to: "/smart-agricultural-machines", label: "Smart machines" },
      { to: "/crops-and-food", label: "Crops & food" },
      { to: "/farmer-health", label: "Farmer health" },
      { to: "/farmer-education", label: "Farmer education" },
    ],
  },
];

const SOCIAL = [
  { href: whatsappLink(), label: "WhatsApp", icon: <MessageCircle size={18} aria-hidden="true" /> },
  { href: OWNER.linkedin, label: "LinkedIn", icon: <LinkedinIcon /> },
  { href: OWNER.github, label: "GitHub", icon: <GithubIcon /> },
  { href: OWNER.portfolio, label: "Portfolio", icon: <Globe size={18} aria-hidden="true" /> },
  { href: `mailto:${OWNER.email}`, label: "Email", icon: <Mail size={18} aria-hidden="true" /> },
];

export function SiteFooter() {
  const { user } = useSession();
  const year = new Date().getFullYear();
  const account = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/settings", label: "Profile & settings" },
      ]
    : [
        { to: "/login", label: "Login" },
        { to: "/register", label: "Register" },
      ];
  return (
    <footer className="agri-footer">
      <div className="agri-footer-top">
        <div className="agri-footer-brand">
          <Link to="/" className="agri-footer-logo">
            <img src={logo} alt="" width="48" height="48" />
            <span>
              <b>AgriSmart</b>
              <small>Smart Agriculture &amp; Production Systems</small>
            </span>
          </Link>
          <p className="agri-footer-tagline">{BRAND.tagline}</p>
          <p className="agri-footer-desc">
            Agricultural intelligence, AI crop insights, weather and soil analysis in one platform for better farming
            decisions.
          </p>
          <ul className="agri-social" aria-label="AgriSmart on social media">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  title={s.label}
                  {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
          <address className="agri-footer-address">
            <span>
              <MapPin size={15} aria-hidden="true" /> {OWNER.location}
            </span>
            <a href={`tel:${OWNER.phone}`}>
              <Phone size={15} aria-hidden="true" /> {OWNER.phoneDisplay}
            </a>
          </address>
        </div>

        <nav className="agri-footer-cols" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2>Account</h2>
            <ul>
              {account.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms and Conditions</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="agri-footer-bottom">
        <p>
          &copy; {year} AgriSmart. All rights reserved. Developed by{" "}
          <a href={OWNER.portfolio} target="_blank" rel="noopener noreferrer">
            {OWNER.name}
          </a>
          .
        </p>
        <ul>
          <li>
            <Link to="/disclaimer">Disclaimer</Link>
          </li>
          <li>
            <Link to="/image-credits">Image credits</Link>
          </li>
        </ul>
        <button type="button" className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp size={18} aria-hidden="true" /> Back to top
        </button>
      </div>
    </footer>
  );
}
