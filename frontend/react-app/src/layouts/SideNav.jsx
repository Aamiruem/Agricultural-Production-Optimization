import { NavLink } from "react-router";
import { Activity, Bot, ChartNoAxesCombined, ChevronLeft, ChevronRight, CloudSun, Droplets, FlaskConical, House, Info, LibraryBig, Mail, Map, ScanLine, Sprout, Tractor, TrendingUp, WalletCards } from "lucide-react";

const LINKS = [
  { to: "/dashboard", label: "Overview", icon: House },
  { to: "/recommend", label: "Crop recommendation", icon: Sprout },
  { to: "/yield-prediction", label: "Yield prediction", icon: TrendingUp },
  { to: "/soil-analysis", label: "Soil analyzer", icon: FlaskConical },
  { to: "/crops", label: "Crop library", icon: LibraryBig },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/fertilizer", label: "Fertilizer planner", icon: WalletCards },
  { to: "/irrigation-optimization", label: "Irrigation", icon: Droplets },
  { to: "/disease-detection", label: "Crop health", icon: ScanLine },
  { to: "/reports", label: "Reports & charts", icon: ChartNoAxesCombined },
];
const WORKSPACE = [
  { to: "/planner", label: "Field planner", icon: Map },
  { to: "/farms", label: "My farms", icon: Tractor },
  { to: "/assistant", label: "Farm assistant", icon: Bot },
  { to: "/insights", label: "Model insights", icon: Activity },
  { to: "/about", label: "About AgriSmart", icon: Info },
  { to: "/contact", label: "Help & feedback", icon: Mail },
];

export function SideNav({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const renderLinks = (links) => links.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} onClick={onCloseMobile} title={collapsed ? label : undefined} className={({ isActive }) => `side-nav-link${isActive ? " active" : ""}`}>
      <Icon size={18} aria-hidden="true"/><span>{label}</span>
    </NavLink>
  ));
  return <>
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onCloseMobile}/>}
    <aside className={`side-nav${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`} aria-label="Main navigation">
      <div className="side-nav-heading"><span>{!collapsed && "FARM TOOLS"}</span><button className="side-nav-collapse" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</button></div>
      <nav className="side-nav-groups">
        <div className="side-nav-group-label">{!collapsed && "WORKSPACE"}</div>
        {renderLinks(LINKS)}
        <div className="side-nav-group-label mt-4">{!collapsed && "YOUR FARM"}</div>
        {renderLinks(WORKSPACE)}
      </nav>
      {!collapsed && <div className="side-nav-help"><span className="help-icon">🌱</span><b>Grow with confidence</b><small>Use local soil tests and expert advice to guide field decisions.</small></div>}
    </aside>
  </>;
}
