import { useEffect } from "react";

/** Sets the browser tab title (and meta description) for SEO and accessibility. */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | AgriOptima` : "AgriOptima — Crop & Fertilizer Recommendations";
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}
