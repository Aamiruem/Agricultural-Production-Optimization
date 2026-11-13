"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

// Context API: app-wide light/dark theme.
// The `dark` class on <html> is the single source of truth. It is set before
// first paint by THEME_INIT_SCRIPT (see layout.tsx) to avoid a flash, and read
// here with useSyncExternalStore so server and client renders stay consistent.

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "agri-theme";
const EVENT = "agri-theme-change";

export const THEME_INIT_SCRIPT = `(() => {
  try {
    const saved = localStorage.getItem("${STORAGE_KEY}");
    const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();`;

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

const getSnapshot = (): ThemeMode =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const getServerSnapshot = (): ThemeMode => "light";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: ThemeMode) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage can be unavailable (private mode); the theme still applies
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggle: () => setMode(mode === "dark" ? "light" : "dark") }),
    [mode, setMode],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used inside <ThemeModeProvider>");
  return ctx;
}
