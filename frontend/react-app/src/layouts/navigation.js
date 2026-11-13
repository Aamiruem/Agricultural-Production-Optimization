import { G } from "@/lib/icons";

// Single source of truth for navigation (drawer, footer, search, bottom bar).
// Icons are Material Symbols names; colours come from Google's palette.
export const NAV_GROUPS = [
  { label: "side.overview", links: [
    { to: "/dashboard", key: "side.dashboard", icon: "space_dashboard", color: G.blue },
    { to: "/data-dashboard", key: "side.dataDash", icon: "query_stats", color: G.purple },
  ] },
  { label: "side.tools", links: [
    { to: "/crop-recommendation", key: "side.recommend", icon: "potted_plant", color: G.green },
    { to: "/yield-prediction", key: "side.yield", icon: "trending_up", color: G.blue },
    { to: "/soil-analysis", key: "side.soil", icon: "science", color: G.brown },
    { to: "/weather", key: "side.weather", icon: "partly_cloudy_day", color: G.yellow },
    { to: "/fertilizer", key: "side.fertilizer", icon: "compost", color: G.orange },
    { to: "/irrigation-optimization", key: "side.irrigation", icon: "water_drop", color: G.cyan },
    { to: "/disease-detection", key: "side.disease", icon: "pest_control", color: G.red },
    { to: "/seasonal-advisor", key: "side.advisor", icon: "tips_and_updates", color: G.yellow },
    { to: "/rotation-planner", key: "side.rotation", icon: "autorenew", color: G.teal },
    { to: "/reports", key: "side.reports", icon: "monitoring", color: G.purple },
  ] },
  { label: "side.explore", links: [
    { to: "/crops", key: "side.crops", icon: "nutrition", color: G.red },
    { to: "/crop-gallery", key: "side.gallery", icon: "photo_library", color: G.pink },
    { to: "/states", key: "side.states", icon: "map", color: G.teal },
    { to: "/soil-types", key: "side.soils", icon: "landscape", color: G.brown },
  ] },
  { label: "side.farm", links: [
    { to: "/planner", key: "side.planner", icon: "edit_calendar", color: G.green },
    { to: "/farms", key: "side.farms", icon: "agriculture", color: G.orange },
    { to: "/assistant", key: "side.assistant", icon: "smart_toy", color: G.purple },
    { to: "/insights", key: "side.insights", icon: "insights", color: G.pink },
    { to: "/about", key: "side.about", icon: "info", color: G.blue },
    { to: "/contact", key: "side.contact", icon: "mail", color: G.red },
  ] },
];

export const ALL_LINKS = NAV_GROUPS.flatMap((g) => g.links);

export const TOP_LINKS = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/#features", key: "nav.features" },
  { to: "/#solutions", key: "nav.solutions" },
  { to: "/#how-it-works", key: "nav.how" },
  { to: "/contact", key: "nav.contact" },
];

/** Mobile bottom navigation (Google app style). `more` opens the drawer. */
export const BOTTOM_LINKS = [
  { to: "/", key: "nav.home", icon: "home" },
  { to: "/dashboard", key: "side.dashboard", icon: "space_dashboard" },
  { to: "/crops", key: "side.crops", icon: "nutrition" },
  { to: "/weather", key: "side.weather", icon: "partly_cloudy_day" },
];
