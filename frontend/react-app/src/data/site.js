// Brand, owner and contact details used across the site (header, footer, contact,
// developer profile and structured data). Plain data with no imports, so the build
// (vite.config.js) can read it too.

export const BRAND = {
  name: "AgriSmart",
  fullName: "AgriSmart – Smart Agriculture & Production Systems",
  tagline: "Growing Smarter. Farming Better. Building a Sustainable Future.",
  description:
    "AgriSmart is an educational smart-agriculture platform covering agricultural production systems, farm machinery, AI and machine learning for farming, crops and food, rural health and nutrition — with free AI tools for Indian farmers.",
  // Date the site content was last reviewed (shown on pages and used as sitemap lastmod).
  contentUpdated: "2026-11-14",
};

export const OWNER = {
  name: "Aamir Hussain Azad",
  title: "AI/ML Engineer & Full-Stack Developer",
  location: "Gurugram, Haryana, India",
  city: "Gurugram",
  region: "Haryana",
  country: "IN",
  phoneDisplay: "+91 99318 79953",
  phone: "+919931879953",
  email: "aamirhussainazad786@gmail.com",
  whatsapp: "https://wa.me/919931879953",
  portfolio: "https://aamir-hussain-azad.vercel.app/",
  github: "https://github.com/Aamiruem",
  linkedin: "https://www.linkedin.com/in/aamir-hussain-azad-62623924b/",
  photo: "https://aamir-hussain-azad.vercel.app/assets/aamir-hussain-azad-256.webp",
  education: {
    degree: "B.Tech in Computer Science Engineering – Artificial Intelligence & Machine Learning",
    school: "University of Engineering and Management, Jaipur",
    year: "2024",
  },
};

/** WhatsApp chat link, optionally with a pre-filled message. */
export function whatsappLink(text) {
  return text ? `${OWNER.whatsapp}?text=${encodeURIComponent(text)}` : OWNER.whatsapp;
}

/** mailto: link with an optional subject and body. */
export function mailtoLink(subject, body) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${OWNER.email}${query ? `?${query}` : ""}`;
}

export const SOCIAL_LINKS = [
  { id: "whatsapp", label: "WhatsApp", href: OWNER.whatsapp },
  { id: "linkedin", label: "LinkedIn", href: OWNER.linkedin },
  { id: "github", label: "GitHub", href: OWNER.github },
  { id: "portfolio", label: "Portfolio", href: OWNER.portfolio },
  { id: "email", label: "Email", href: `mailto:${OWNER.email}` },
];

/** Responsive image helper: images live at /images/<key>-640.webp and -1200.webp. */
export function photo(key) {
  return {
    src: `/images/${key}-1200.webp`,
    srcSet: `/images/${key}-640.webp 640w, /images/${key}-1200.webp 1200w`,
    width: 1200,
    height: 800,
  };
}
