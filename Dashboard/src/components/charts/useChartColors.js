import { useMemo } from "react";

import { useTheme } from "@/context/theme.js";

const TOKENS = ["series-1", "series-2", "series-3", "series-4", "diverge-pos", "diverge-neg", "ink", "ink-2", "ink-3",
  "grid", "outline", "surface", "surface-2", "primary", "good", "warn", "bad"];

const FALLBACK = {
  "series-1": "#1a73e8", "series-2": "#d93025", "series-3": "#188038", "series-4": "#d18b00",
  "diverge-pos": "#1a73e8", "diverge-neg": "#d93025", ink: "#202124", "ink-2": "#5f6368", "ink-3": "#80868b",
  grid: "#eceef1", outline: "#dadce0", surface: "#ffffff", "surface-2": "#f1f3f4", primary: "#1a73e8",
  good: "#137333", warn: "#b06000", bad: "#c5221f",
};

/**
 * Resolved chart colours for the active theme. SVG presentation attributes don't
 * reliably resolve CSS variables, so charts get concrete hex values that are
 * re-read whenever the theme flips.
 */
export function useChartColors() {
  const { resolved } = useTheme();
  return useMemo(() => {
    const style = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const out = {};
    for (const t of TOKENS) out[t] = style?.getPropertyValue(`--${t}`).trim() || FALLBACK[t];
    out.series = [out["series-1"], out["series-2"], out["series-3"], out["series-4"]];
    out.theme = resolved;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute on theme change only
  }, [resolved]);
}
