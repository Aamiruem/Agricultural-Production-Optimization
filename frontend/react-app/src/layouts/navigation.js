import { G } from "@/lib/icons";

// Single source of truth for navigation.
//
// PUBLIC_LINKS  — the public website navbar (signed-out visitors and everyone on public pages).
// NAV_GROUPS    — the signed-in app's sidebar (labels are i18n keys, icons are Material Symbols).

export const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/ai-in-agriculture", label: "AI Solutions" },
  { to: "/#how-it-works", label: "How It Works" },
  { to: "/contact", label: "Contact" },
];

export const NAV_GROUPS = [
  {
    id: "overview",
    label: "side.groupOverview",
    links: [
      { to: "/dashboard", key: "side.dashboard", icon: "space_dashboard", color: G.blue },
      { to: "/local-intelligence#map", key: "side.indiaMap", icon: "map", color: G.teal },
      { to: "/local-intelligence", key: "side.locationAnalysis", icon: "my_location", color: G.red },
      { to: "/weather", key: "side.weatherIntel", icon: "partly_cloudy_day", color: G.yellow },
      { to: "/soil-analysis", key: "side.soilHealth", icon: "science", color: G.brown },
      { to: "/crop-recommendation", key: "side.cropAdvisor", icon: "potted_plant", color: G.green },
      { to: "/yield-prediction", key: "side.yield", icon: "trending_up", color: G.blue },
      { to: "/data-dashboard", key: "side.dataCompare", icon: "upload_file", color: G.purple },
      { to: "/reports", key: "side.reports", icon: "monitoring", color: G.purple },
    ],
  },
  {
    id: "plan",
    label: "side.groupPlan",
    links: [
      { to: "/seasonal-advisor", key: "side.seasonAdvisor", icon: "calendar_month", color: G.yellow },
      { to: "/rotation-planner", key: "side.rotation", icon: "autorenew", color: G.teal },
      { to: "/planner", key: "side.fieldPlanner", icon: "edit_calendar", color: G.green },
      { to: "/fertilizer", key: "side.fertilizer", icon: "compost", color: G.orange },
      { to: "/irrigation-optimization", key: "side.irrigation", icon: "water_drop", color: G.cyan },
      { to: "/disease-detection", key: "side.disease", icon: "pest_control", color: G.red },
    ],
  },
  {
    id: "farm",
    label: "side.groupFarm",
    links: [
      { to: "/farms", key: "side.myFarms", icon: "agriculture", color: G.orange },
      { to: "/assistant", key: "side.assistant", icon: "smart_toy", color: G.purple },
      { to: "/insights", key: "side.modelInsights", icon: "insights", color: G.pink },
    ],
  },
  {
    id: "explore",
    label: "side.groupExplore",
    links: [
      { to: "/crops", key: "side.cropLibrary", icon: "nutrition", color: G.red },
      { to: "/crop-gallery", key: "side.gallery", icon: "photo_library", color: G.pink },
      { to: "/states", key: "side.stateGuide", icon: "map", color: G.teal },
      { to: "/soil-types", key: "side.soilTypes", icon: "landscape", color: G.brown },
      { to: "/learn", key: "side.knowledge", icon: "menu_book", color: G.green },
    ],
  },
];

/** Links under the sidebar's help card. */
export const SECONDARY_LINKS = [
  { to: "/settings", key: "side.settings", icon: "tune", color: G.blue },
  { to: "/", key: "side.publicSite", icon: "home", color: G.green },
  { to: "/contact", key: "side.contact", icon: "mail", color: G.red },
];

/** Every app destination, for the app's global search. */
export const ALL_LINKS = [...NAV_GROUPS.flatMap((g) => g.links), ...SECONDARY_LINKS];

/** Mobile bottom navigation in the app; "More" opens the sidebar drawer. */
export const BOTTOM_LINKS = [
  { to: "/dashboard", key: "side.dashboard", icon: "space_dashboard" },
  { to: "/local-intelligence", key: "side.locationAnalysis", icon: "my_location" },
  { to: "/crop-recommendation", key: "side.cropAdvisor", icon: "potted_plant" },
  { to: "/weather", key: "side.weather", icon: "partly_cloudy_day" },
];

/** Old short URLs kept working as redirects to the canonical page (also 301s on the host). */
export { REDIRECTS as ROUTE_ALIASES } from "@/seo/routes";
