"use client";

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useMemo, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { ThemeModeProvider, useThemeMode } from "@/context/theme-context";
import { useHistoryStore } from "@/store/history-store";
import { makeStore, persistFields } from "@/store/store";

/** MUI theme that follows the Context API theme mode. */
function MuiTheme({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === "dark" ? "#66bb6a" : "#2e7d32" },
          secondary: { main: "#f9a825" },
        },
        shape: { borderRadius: 10 },
        typography: { fontFamily: "var(--font-sans), system-ui, sans-serif" },
      }),
    [mode],
  );
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Lazy useState keeps one instance per browser tab without touching refs in render.
  const [store] = useState(makeStore);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  // Client-only persistence: Redux fields + Zustand history.
  useEffect(() => persistFields(store), [store]);
  useEffect(() => {
    void useHistoryStore.persist.rehydrate();
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider>
          <MuiTheme>{children}</MuiTheme>
        </ThemeModeProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
