import { useEffect } from "react";
import { useLocation } from "react-router";

import { routeSeo } from "@/seo/routes";
import { structuredData } from "@/seo/structuredData";

const SITE = "AgriSmart";
// Canonical origin: the production URL baked in at build time, so preview domains
// never compete with the real site.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");

function upsert(tag, keyAttr, keyValue, attr, value) {
  let el = document.head.querySelector(`${tag}[${keyAttr}="${keyValue}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(keyAttr, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setJsonLd(data) {
  let el = document.getElementById("ld-page");
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "ld-page";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Per-route <title>, description, canonical, robots, Open Graph/Twitter tags and
 * JSON-LD. Values come from the SEO registry (src/seo/routes.js) when the route is
 * listed there; `title`/`description` are fallbacks for unlisted routes.
 */
export function useDocumentTitle(title, description) {
  const { pathname } = useLocation();
  useEffect(() => {
    const seo = routeSeo(pathname);
    const full = seo?.title ?? (title ? `${title} | ${SITE}` : `${SITE} – Smart Agriculture & Production Systems`);
    const desc = seo?.description ?? description;
    const path = seo?.path ?? pathname;
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;
    const image = `${SITE_URL}${seo?.image ?? "/og/home.jpg"}`;

    document.title = full;
    upsert("link", "rel", "canonical", "href", url);
    upsert("meta", "name", "robots", "content", seo && !seo.noindex ? "index,follow,max-image-preview:large" : "noindex,follow");
    upsert("meta", "property", "og:title", "content", full);
    upsert("meta", "property", "og:url", "content", url);
    upsert("meta", "property", "og:image", "content", image);
    upsert("meta", "property", "og:type", "content", seo?.type === "Article" ? "article" : "website");
    upsert("meta", "name", "twitter:title", "content", full);
    upsert("meta", "name", "twitter:image", "content", image);
    if (desc) {
      upsert("meta", "name", "description", "content", desc);
      upsert("meta", "property", "og:description", "content", desc);
      upsert("meta", "name", "twitter:description", "content", desc);
    }
    setJsonLd(structuredData(SITE_URL, pathname));
  }, [pathname, title, description]);
}
