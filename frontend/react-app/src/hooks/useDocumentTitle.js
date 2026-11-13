import { useEffect } from "react";

const SITE = "AgriSmart";
const DEFAULT_TITLE = "AgriSmart — AI Crop Recommendation, Yield Prediction & Smart Farming for India";

function upsert(tag, keyAttr, keyValue, attr, value) {
  let el = document.head.querySelector(`${tag}[${keyAttr}="${keyValue}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(keyAttr, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Per-route title, description, canonical and social tags (SEO). */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : DEFAULT_TITLE;
    document.title = full;
    const url = `${window.location.origin}${window.location.pathname}`;
    upsert("link", "rel", "canonical", "href", url);
    upsert("meta", "property", "og:title", "content", full);
    upsert("meta", "property", "og:url", "content", url);
    upsert("meta", "name", "twitter:title", "content", full);
    if (description) {
      upsert("meta", "name", "description", "content", description);
      upsert("meta", "property", "og:description", "content", description);
      upsert("meta", "name", "twitter:description", "content", description);
    }
  }, [title, description]);
}
