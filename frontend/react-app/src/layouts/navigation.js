import {
  Activity, Bot, ChartNoAxesCombined, CloudSun, Droplets, FlaskConical, Info, LayoutDashboard, LibraryBig, Mail,
  Map, MapPinned, Mountain, ScanLine, Sprout, Tractor, TrendingUp, WalletCards,
} from "lucide-react";

// Single source of truth for the app's navigation (sidebar, footer, sitemap).
export const NAV_GROUPS = [
  { label: "side.overview", links: [
    { to: "/dashboard", key: "side.dashboard", icon: LayoutDashboard, color: "#16a34a" },
  ] },
  { label: "side.tools", links: [
    { to: "/crop-recommendation", key: "side.recommend", icon: Sprout, color: "#22c55e" },
    { to: "/yield-prediction", key: "side.yield", icon: TrendingUp, color: "#2563eb" },
    { to: "/soil-analysis", key: "side.soil", icon: FlaskConical, color: "#a16207" },
    { to: "/weather", key: "side.weather", icon: CloudSun, color: "#0ea5e9" },
    { to: "/fertilizer", key: "side.fertilizer", icon: WalletCards, color: "#d97706" },
    { to: "/irrigation-optimization", key: "side.irrigation", icon: Droplets, color: "#0284c7" },
    { to: "/disease-detection", key: "side.disease", icon: ScanLine, color: "#e11d48" },
    { to: "/reports", key: "side.reports", icon: ChartNoAxesCombined, color: "#7c3aed" },
  ] },
  { label: "side.explore", links: [
    { to: "/crops", key: "side.crops", icon: LibraryBig, color: "#ea580c" },
    { to: "/states", key: "side.states", icon: MapPinned, color: "#0d9488" },
    { to: "/soil-types", key: "side.soils", icon: Mountain, color: "#92400e" },
  ] },
  { label: "side.farm", links: [
    { to: "/planner", key: "side.planner", icon: Map, color: "#65a30d" },
    { to: "/farms", key: "side.farms", icon: Tractor, color: "#b45309" },
    { to: "/assistant", key: "side.assistant", icon: Bot, color: "#9333ea" },
    { to: "/insights", key: "side.insights", icon: Activity, color: "#db2777" },
    { to: "/about", key: "side.about", icon: Info, color: "#0891b2" },
    { to: "/contact", key: "side.contact", icon: Mail, color: "#4f46e5" },
  ] },
];

export const TOP_LINKS = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/#features", key: "nav.features" },
  { to: "/#solutions", key: "nav.solutions" },
  { to: "/#how-it-works", key: "nav.how" },
  { to: "/contact", key: "nav.contact" },
];
