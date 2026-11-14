// Material Symbols (Rounded) used by the app. The Google Fonts request in index.html
// is subset to exactly these names, so add a name here before using it in <MIcon>.
export const ICON_NAMES = [
  "account_circle", "add", "admin_panel_settings", "agriculture", "arrow_forward", "auto_awesome", "autorenew", "calendar_month", "check_circle",
  "close", "cloud_done", "cloud_off", "compost", "dark_mode", "delete", "download", "edit_calendar", "filter_alt", "flag", "forum", "grass", "help", "history", "home", "info",
  "insights", "landscape", "light_mode", "location_on", "logout", "mail", "map", "menu", "monitoring", "my_location", "more_horiz",
  "notifications", "nutrition", "partly_cloudy_day", "photo_library", "pest_control", "potted_plant", "psychology", "query_stats", "rainy", "rocket_launch",
  "savings", "science", "search", "smart_toy", "space_dashboard", "support_agent", "table_chart", "tips_and_updates", "translate", "trending_up", "upload_file",
  "verified_user", "visibility", "water_drop", "wb_sunny",
  "tune", "menu_book", "calculate", "eco",
];

/** Google's product palette, used to tint icons (each icon keeps a fixed colour). */
export const G = {
  blue: "#1a73e8",
  red: "#d93025",
  yellow: "#f9ab00",
  green: "#188038",
  purple: "#9334e6",
  cyan: "#12b5cb",
  orange: "#e8710a",
  pink: "#e52592",
  teal: "#129eaf",
  brown: "#8d6e63",
};

/** Google Fonts URL for the icon subset (names must be sorted alphabetically). */
export function iconFontUrl() {
  const names = [...new Set(ICON_NAMES)].sort().join(",");
  return `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&icon_names=${names}&display=block`;
}
