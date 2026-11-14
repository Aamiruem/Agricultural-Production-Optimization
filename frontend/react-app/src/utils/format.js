export function formatPercent(value, digits = 0) {
  const clamped = Math.min(Math.max(Number(value) || 0, 0), 1);
  return `${(clamped * 100).toFixed(digits)}%`;
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString();
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

/** Only allow same-site relative redirects (prevents open redirects after login). */
export function safeRedirect(next, fallback = "/dashboard") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
