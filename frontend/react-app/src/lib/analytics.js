// Google Analytics 4 (gtag.js). Enabled only when VITE_GA_MEASUREMENT_ID is set at build time.
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics() {
  if (!MEASUREMENT_ID || typeof window === "undefined" || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // Page views are sent manually on route change (single-page app).
  window.gtag("config", MEASUREMENT_ID, { anonymize_ip: true, send_page_view: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

export function trackPageView(path) {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name, params = {}) {
  if (MEASUREMENT_ID && window.gtag) window.gtag("event", name, params);
}
