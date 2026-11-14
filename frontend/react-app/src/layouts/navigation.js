import { G } from "@/lib/icons";

// Single source of truth for navigation: side drawer, footer, global search and
// the mobile bottom bar. Labels are i18n keys (src/i18n/translations.js), icons are
// Material Symbols names and colours come from Google's palette.
//
// Sections follow a farmer's season: plan what to grow, look after it while it
// grows, then analyse the results.
export const NAV_GROUPS = [
  {
    id: "site",
    label: "side.groupSite",
    links: [
      { to: "/agricultural-production-systems", key: "nav.agriculture", icon: "agriculture", color: G.green },
      { to: "/smart-agricultural-machines", key: "nav.machines", icon: "precision_manufacturing", color: G.orange },
      { to: "/ai-in-agriculture", key: "nav.ai", icon: "psychology", color: G.purple },
      { to: "/crops-and-food", key: "nav.cropsFood", icon: "grass", color: G.yellow },
      { to: "/farmer-health", key: "nav.health", icon: "medical_services", color: G.red },
      { to: "/food-and-nutrition", key: "nav.nutrition", icon: "restaurant", color: G.pink },
      { to: "/farmer-education", key: "nav.education", icon: "school", color: G.blue },
      { to: "/services", key: "nav.services", icon: "work", color: G.teal },
      { to: "/projects", key: "nav.projects", icon: "code", color: G.brown },
    ],
  },
  {
    id: "home",
    label: "side.groupHome",
    links: [
      { to: "/dashboard", key: "side.dashboard", icon: "space_dashboard", color: G.blue },
      { to: "/data-dashboard", key: "side.dataStudio", icon: "upload_file", color: G.purple },
    ],
  },
  {
    id: "plan",
    label: "side.groupPlan",
    links: [
      { to: "/crop-recommendation", key: "side.cropAdvisor", icon: "potted_plant", color: G.green },
      { to: "/seasonal-advisor", key: "side.seasonAdvisor", icon: "calendar_month", color: G.yellow },
      { to: "/rotation-planner", key: "side.rotation", icon: "autorenew", color: G.teal },
      { to: "/planner", key: "side.fieldPlanner", icon: "edit_calendar", color: G.green },
    ],
  },
  {
    id: "grow",
    label: "side.groupGrow",
    links: [
      { to: "/soil-analysis", key: "side.soilHealth", icon: "science", color: G.brown },
      { to: "/fertilizer", key: "side.fertilizer", icon: "compost", color: G.orange },
      { to: "/irrigation-optimization", key: "side.irrigation", icon: "water_drop", color: G.cyan },
      { to: "/disease-detection", key: "side.disease", icon: "pest_control", color: G.red },
      { to: "/weather", key: "side.weather", icon: "partly_cloudy_day", color: G.yellow },
    ],
  },
  {
    id: "analyse",
    label: "side.groupAnalyse",
    links: [
      { to: "/yield-prediction", key: "side.yield", icon: "trending_up", color: G.blue },
      { to: "/reports", key: "side.reports", icon: "monitoring", color: G.purple },
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
  {
    id: "farm",
    label: "side.groupFarm",
    links: [
      { to: "/farms", key: "side.myFarms", icon: "agriculture", color: G.orange },
      { to: "/assistant", key: "side.assistant", icon: "smart_toy", color: G.purple },
    ],
  },
];

/** Small links under the drawer's help card (not farming tools, so not a section). */
export const SECONDARY_LINKS = [
  { to: "/about", key: "side.about", icon: "info", color: G.blue },
  { to: "/developer", key: "nav.developer", icon: "person", color: G.green },
  { to: "/app", key: "nav.app", icon: "install_mobile", color: G.purple },
  { to: "/contact", key: "side.contact", icon: "mail", color: G.red },
];

const group = (id) => NAV_GROUPS.find((g) => g.id === id).links;

/** Every destination, for global search. */
export const ALL_LINKS = [...NAV_GROUPS.flatMap((g) => g.links), ...SECONDARY_LINKS];

/** Footer "AI tools" column: the planning and growing tools. */
export const FOOTER_TOOLS = [...group("plan"), ...group("grow")];

export const TOP_LINKS = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/agricultural-production-systems", key: "nav.agriculture" },
  { to: "/smart-agricultural-machines", key: "nav.machines" },
  { to: "/ai-in-agriculture", key: "nav.ai" },
  { to: "/crops-and-food", key: "nav.cropsFood" },
  { to: "/farmer-health", key: "nav.health" },
  { to: "/projects", key: "nav.projects" },
  { to: "/contact", key: "nav.contact" },
];

/** Mobile bottom navigation (Google app style); the menu button opens the drawer. */
export const BOTTOM_LINKS = [
  { to: "/", key: "nav.home", icon: "home" },
  { to: "/dashboard", key: "side.dashboard", icon: "space_dashboard" },
  { to: "/crops", key: "side.cropLibrary", icon: "nutrition" },
  { to: "/weather", key: "side.weather", icon: "partly_cloudy_day" },
];

/** Old short URLs kept working as redirects to the canonical page (also 301s on the host). */
export { REDIRECTS as ROUTE_ALIASES } from "@/seo/routes";
