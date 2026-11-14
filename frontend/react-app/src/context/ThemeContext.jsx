import { useCallback, useMemo, useState } from "react";

import { ThemeContext } from "./themeContext";

// Context API: light/dark colour mode shared by the whole app.
// Bootstrap 5.3 reads `data-bs-theme` on <html>; index.html sets it before first paint.

const STORAGE_KEY = "agri-theme";

const currentMode = () => (document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light");

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(currentMode);

  const setMode = useCallback((next) => {
    document.documentElement.setAttribute("data-bs-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore unavailable storage
    }
    setModeState(next);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggle: () => setMode(mode === "dark" ? "light" : "dark") }),
    [mode, setMode],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
