// Material Symbols Rounded used by the dashboard. index.html requests a Google Fonts
// subset of exactly these names (see vite.config.js), so add a name here before
// using it in <Icon name="…" />. src/lib/icons.test.js fails on unknown names.
export const ICON_NAMES = [
  "account_circle", "add", "agriculture", "api", "arrow_downward", "arrow_upward", "auto_awesome", "bar_chart",
  "bolt", "build", "check_circle", "chevron_right", "close", "cloud_off", "compost", "content_copy", "dark_mode",
  "database", "delete", "dns", "eco", "error", "experiment", "forum", "grass", "hub", "info", "insights", "key",
  "landscape", "light_mode", "location_on", "login", "logout", "memory", "menu", "model_training", "monitoring",
  "partly_cloudy_day", "play_arrow", "psychology", "query_stats", "rainy", "refresh", "rocket_launch", "schedule",
  "science", "send", "smart_toy", "space_dashboard", "speed", "stop", "storage", "sync", "table_chart", "terminal",
  "thermostat", "trending_down", "trending_up", "tune", "verified", "warning", "water_drop",
];

/** Google Fonts URL for the icon subset (names must be sorted alphabetically). */
export function iconFontUrl() {
  const names = [...new Set(ICON_NAMES)].sort().join(",");
  return `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&icon_names=${names}&display=block`;
}
