// Chart colours per theme. Mirrors the tokens in src/index.css (palette.test.js
// fails if they drift). SVG presentation attributes don't reliably resolve CSS
// variables, so Recharts gets concrete values.
//
// Categorical order blue → red → green → yellow, validated for colour-vision
// deficiency (adjacent pairs) on #ffffff (light) and #292a2d (dark).
export const CHART_PALETTE = {
  light: {
    "series-1": "#1a73e8",
    "series-2": "#d93025",
    "series-3": "#188038",
    "series-4": "#d18b00",
    "diverge-pos": "#1a73e8",
    "diverge-neg": "#d93025",
    ink: "#202124",
    "ink-2": "#5f6368",
    "ink-3": "#80868b",
    grid: "#eceef1",
    outline: "#dadce0",
    surface: "#ffffff",
    "surface-2": "#f1f3f4",
    primary: "#1a73e8",
    good: "#137333",
    warn: "#b06000",
    bad: "#c5221f",
  },
  dark: {
    "series-1": "#4c8df6",
    "series-2": "#e8584c",
    "series-3": "#14a08a",
    "series-4": "#c98500",
    "diverge-pos": "#4c8df6",
    "diverge-neg": "#e8584c",
    ink: "#e8eaed",
    "ink-2": "#bdc1c6",
    "ink-3": "#9aa0a6",
    grid: "#35363a",
    outline: "#3c4043",
    surface: "#292a2d",
    "surface-2": "#303134",
    primary: "#8ab4f8",
    good: "#81c995",
    warn: "#fdd663",
    bad: "#f28b82",
  },
};
