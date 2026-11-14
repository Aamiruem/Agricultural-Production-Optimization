// Schema.org JSON-LD for each page. Shared by the build (static HTML heads) and the
// client (route changes). Only facts we can stand behind: no ratings, reviews,
// awards or invented business addresses.

import { BRAND, OWNER } from "../data/site.js";

import { breadcrumbTrail, heroUrl, routeSeo } from "./routes.js";

const abs = (site, path) => (path?.startsWith("http") ? path : `${site}${path}`);

function person(site) {
  return {
    "@type": "Person",
    "@id": `${site}/developer#person`,
    name: OWNER.name,
    jobTitle: OWNER.title,
    url: `${site}/developer`,
    image: OWNER.photo,
    email: `mailto:${OWNER.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: OWNER.city,
      addressRegion: OWNER.region,
      addressCountry: OWNER.country,
    },
    alumniOf: { "@type": "CollegeOrUniversity", name: OWNER.education.school },
    knowsAbout: [
      "Machine Learning",
      "Artificial Intelligence",
      "Data Science",
      "Full-Stack Development",
      "Agricultural Technology",
    ],
    sameAs: [OWNER.portfolio, OWNER.github, OWNER.linkedin],
  };
}

function organization(site) {
  return {
    "@type": "Organization",
    "@id": `${site}/#organization`,
    name: BRAND.name,
    url: `${site}/`,
    logo: { "@type": "ImageObject", url: `${site}/icons/icon-512.png`, width: 512, height: 512 },
    slogan: BRAND.tagline,
    description: BRAND.description,
    founder: { "@id": `${site}/developer#person` },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: OWNER.phone,
      email: OWNER.email,
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

function website(site) {
  return {
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: BRAND.name,
    alternateName: BRAND.fullName,
    url: `${site}/`,
    inLanguage: "en-IN",
    publisher: { "@id": `${site}/#organization` },
  };
}

function breadcrumbs(site, pathname) {
  const trail = breadcrumbTrail(pathname);
  if (trail.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    "@id": `${site}${pathname}#breadcrumb`,
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(site, c.path),
    })),
  };
}

/** JSON-LD object (with @graph) for `pathname`, or null if the route is unknown. */
export function structuredData(site, pathname) {
  const r = routeSeo(pathname);
  if (!r || r.noindex) return null;
  const url = abs(site, r.path === "/" ? "/" : r.path);
  const crumbs = breadcrumbs(site, r.path);
  const graph = [organization(site), website(site), person(site)];

  const page = {
    "@type": r.type === "Article" ? "WebPage" : r.type,
    "@id": `${url}#webpage`,
    url,
    name: r.title,
    description: r.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${site}/#website` },
    primaryImageOfPage: { "@type": "ImageObject", url: abs(site, r.image) },
    dateModified: r.updated,
  };
  if (crumbs) page.breadcrumb = { "@id": crumbs["@id"] };
  if (r.type === "ProfilePage") page.mainEntity = { "@id": `${site}/developer#person` };
  graph.push(page);
  if (crumbs) graph.push(crumbs);

  if (r.type === "Article") {
    graph.push({
      "@type": "Article",
      "@id": `${url}#article`,
      headline: r.title.split(/ [–|] /)[0],
      description: r.description,
      image: [abs(site, r.image), ...(heroUrl(r) ? [abs(site, heroUrl(r))] : [])],
      datePublished: r.updated,
      dateModified: r.updated,
      author: { "@id": `${site}/developer#person` },
      publisher: { "@id": `${site}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      inLanguage: "en-IN",
    });
  }

  if (r.path === "/app") {
    graph.push({
      "@type": "WebApplication",
      "@id": `${site}/app#application`,
      name: BRAND.name,
      url: `${site}/app`,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Agriculture",
      operatingSystem: "Any (web browser); installable as a PWA",
      browserRequirements: "Requires JavaScript and a modern browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      featureList: [
        "AI crop recommendation",
        "Crop yield prediction",
        "Soil health analysis",
        "Fertilizer calculator",
        "FAO-56 irrigation planner",
        "Crop disease screening",
        "Live farm weather",
      ],
      creator: { "@id": `${site}/developer#person` },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
