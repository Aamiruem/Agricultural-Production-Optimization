import { NavLink } from "react-router";
import { Activity, Bot, ChartNoAxesCombined, CloudSun, Droplets, FlaskConical, House, Info, LibraryBig, Mail, Map, ScanLine, Sprout, Tractor, TrendingUp, WalletCards } from "lucide-react";

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

export function SideNav({ open, onClose }) {
  const renderLinks = (links) => links.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} onClick={() => { if (window.matchMedia("(max-width: 991.98px)").matches) onClose(); }} className={({ isActive }) => `side-nav-link${isActive ? " active" : ""}`}>
      <Icon size={18} aria-hidden="true"/><span>{label}</span>
    </NavLink>
  ));
  return <>
    <button className={`sidebar-backdrop${open ? " is-active" : ""}`} aria-label="Close navigation" onClick={onClose} tabIndex={open ? 0 : -1}/>
    <aside id="app-sidebar" className={`side-nav${open ? " is-open" : " is-closed"}`} aria-label="Main navigation" aria-hidden={!open} inert={!open}>
      <div className="side-nav-heading"><span>FARM TOOLS</span></div>
      <nav className="side-nav-groups">
        <div className="side-nav-group-label">WORKSPACE</div>
        {renderLinks(LINKS)}
        <div className="side-nav-group-label mt-4">YOUR FARM</div>
        {renderLinks(WORKSPACE)}
      </nav>
      <div className="side-nav-help"><Sprout className="help-icon" size={20}/><b>Grow with confidence</b><small>Use local soil tests and expert advice to guide field decisions.</small></div>
    </aside>
  </>;
}
