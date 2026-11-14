import { useMemo } from "react";

import { useTheme } from "@/context/theme.js";

import { CHART_PALETTE } from "./palette.js";

/** Concrete chart colours for the active theme (re-computed when the theme flips). */
export function useChartColors() {
  const { resolved } = useTheme();
  return useMemo(() => {
    const p = CHART_PALETTE[resolved] ?? CHART_PALETTE.light;
    return { ...p, series: [p["series-1"], p["series-2"], p["series-3"], p["series-4"]], theme: resolved };
  }, [resolved]);
}
