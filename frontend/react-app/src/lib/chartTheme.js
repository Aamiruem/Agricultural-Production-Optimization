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
    grid: dark ? "rgba(255,255,255,.08)" : "rgba(31,31,31,.08)",
    axis: dark ? "#c4c7c5" : "#444746",
    text: dark ? "#e3e3e3" : "#1f1f1f",
    surface: dark ? "#1e1f20" : "#ffffff",
    primary: dark ? "#4ade80" : "#15803d",
    muted: dark ? "#5f6368" : "#bdc1c6",
    muted2: dark ? "#80868b" : "#9aa0a6",
  };
}

/** Colours for the current theme; pass `force="dark"` for always-dark panels. */
export function useChartColors(force) {
  const { mode } = useTheme();
  return chartColors(force || mode);
}

export const compact = (v) => Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);
