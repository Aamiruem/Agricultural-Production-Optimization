import { useTheme } from "@/hooks/useTheme";

// Validated categorical palette (fixed order, never cycled) — light and dark steps.
const SERIES = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

export function chartColors(mode) {
  const dark = mode === "dark";
  return {
    series: SERIES[dark ? "dark" : "light"],
    grid: dark ? "rgba(255,255,255,.08)" : "rgba(15,40,25,.08)",
    axis: dark ? "#a8b8ad" : "#5d6f63",
    text: dark ? "#eef5ef" : "#10261a",
    surface: dark ? "#14201a" : "#ffffff",
    primary: dark ? "#4ade80" : "#16a34a",
  };
}

/** Colours for the current theme; pass `force="dark"` for always-dark panels. */
export function useChartColors(force) {
  const { mode } = useTheme();
  return chartColors(force || mode);
}

export const compact = (v) => Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);
