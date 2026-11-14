import { ArrowUp, Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { GithubIcon, LinkedinIcon } from "@/components/site/SiteKit";
import { PRODUCTION_SYSTEM_INDEX as PRODUCTION_SYSTEMS } from "@/data/content/productionSystemsIndex";
import { BRAND, OWNER, whatsappLink } from "@/data/site";

const pick = (list, slugs) => slugs.map((s) => list.find((x) => x.slug === s));

const COLUMNS = [
  {
    title: "About AgriSmart",
    links: [
      { to: "/about", label: "About us" },
      { to: "/about#mission", label: "Mission & vision" },
      { to: "/developer", label: "Developer" },
      { to: "/services", label: "Services" },
      { to: "/projects", label: "Projects" },
    ],
  },
  {
    title: "Agriculture",
    links: [
      { to: "/agricultural-production-systems", label: "Production systems" },
      ...pick(PRODUCTION_SYSTEMS, [
        "organic-farming",
        "precision-agriculture",
        "sustainable-agriculture",
        "irrigation-systems",
      ]).map((s) => ({
        to: `/agricultural-production-systems/${s.slug}`,
        label: s.title,
      })),
      { to: "/crops-and-food", label: "Crops & food" },
    ],
  },
  {
    title: "Smart Machines",
    links: [
      { to: "/smart-agricultural-machines", label: "All machines" },
      { to: "/smart-agricultural-machines#smart-tractors", label: "Smart Tractors" },
      { to: "/smart-agricultural-machines#combine-harvesters", label: "Combine Harvesters" },
      { to: "/smart-agricultural-machines#agricultural-drones", label: "Agricultural Drones" },
      { to: "/smart-agricultural-machines#agricultural-robots", label: "Agricultural Robots" },
      { to: "/smart-agricultural-machines#smart-irrigation-systems", label: "Smart Irrigation" },
    ],
  },
  {
    title: "AI/ML Solutions",
    links: [
      { to: "/ai-in-agriculture", label: "AI in agriculture" },
      { to: "/crop-recommendation", label: "Crop recommendation" },
      { to: "/yield-prediction", label: "Crop yield prediction" },
      { to: "/disease-detection", label: "Plant disease detection" },
      { to: "/irrigation-optimization", label: "Smart irrigation planner" },
      { to: "/ai-in-agriculture#satellite-crop-monitoring", label: "Satellite crop monitoring" },
    ],
  },
  {
    title: "Healthcare & Nutrition",
    links: [
      { to: "/farmer-health", label: "Farmer health" },
      { to: "/farmer-health#heat-stress", label: "Heat-stress prevention" },
      { to: "/farmer-health#pesticide-safety", label: "Pesticide safety" },
      { to: "/food-and-nutrition", label: "Food & nutrition" },
      { to: "/food-and-nutrition#balanced-diet", label: "Balanced diet" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/farmer-education", label: "Farmer education" },
      { to: "/farmer-education#schemes", label: "Government schemes" },
      { to: "/learn", label: "Knowledge hub" },
      { to: "/crop-gallery", label: "Crop gallery" },
      { to: "/app", label: "Web app & tools" },
      { to: "/image-credits", label: "Image credits" },
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
  const year = new Date().getFullYear();
  return (
    <footer className="agri-footer">
      <div className="agri-footer-top">
        <div className="agri-footer-brand">
          <Link to="/" className="agri-footer-logo" aria-label="AgriSmart home">
            <img src={logo} alt="" width="48" height="48" />
            <span>
              <b>AgriSmart</b>
              <small>Smart Agriculture &amp; Production Systems</small>
            </span>
          </Link>
          <p className="agri-footer-tagline">{BRAND.tagline}</p>
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
          <a
            href={whatsappLink("Hello Aamir, I visited AgriSmart and would like to know more.")}
            target="_blank"
            rel="noopener noreferrer"
            className="site-btn site-btn--whatsapp agri-footer-wa"
          >
            <MessageCircle size={18} aria-hidden="true" /> Chat on WhatsApp
          </a>
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
          <div className="agri-footer-contact">
            <h2>Contact Information</h2>
            <address>
              <b>{OWNER.name}</b>
              <span>{OWNER.title}</span>
              <span>
                <MapPin size={15} aria-hidden="true" /> {OWNER.location}
              </span>
              <a href={`tel:${OWNER.phone}`}>
                <Phone size={15} aria-hidden="true" /> {OWNER.phoneDisplay}
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} aria-hidden="true" /> WhatsApp chat
              </a>
              <a href={`mailto:${OWNER.email}`}>
                <Mail size={15} aria-hidden="true" /> {OWNER.email}
              </a>
              <a href={OWNER.portfolio} target="_blank" rel="noopener noreferrer">
                <Globe size={15} aria-hidden="true" /> Portfolio
              </a>
            </address>
          </div>
        </nav>
      </div>

      <div className="agri-footer-bottom">
        <p>
          &copy; {year} AgriSmart. All Rights Reserved. Developed by{" "}
          <a href={OWNER.portfolio} target="_blank" rel="noopener noreferrer">
            {OWNER.name}
          </a>
          .
        </p>
        <ul>
          <li>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </li>
          <li>
            <Link to="/disclaimer">Disclaimer</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
        <button type="button" className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp size={18} aria-hidden="true" /> Back to top
        </button>
      </div>
    </footer>
  );
}
