export const NAV = [
  { to: "/", label: "Overview", icon: "space_dashboard", section: "Insights" },
  { to: "/studio", label: "AI Studio", icon: "psychology", section: "Insights" },
  { to: "/yield", label: "Yield analytics", icon: "query_stats", section: "Insights" },
  { to: "/farms", label: "Farms", icon: "agriculture", section: "Operations" },
  { to: "/assistant", label: "Assistant", icon: "smart_toy", section: "Operations" },
  { to: "/models", label: "Models", icon: "model_training", section: "Platform" },
  { to: "/mcp", label: "MCP tools", icon: "hub", section: "Platform" },
  { to: "/system", label: "System health", icon: "monitoring", section: "Platform" },
];

export function titleFor(pathname) {
  const match = NAV.filter((n) => n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)).pop();
  return match?.label ?? (pathname.startsWith("/login") ? "Sign in" : "AgriSmart");
}
