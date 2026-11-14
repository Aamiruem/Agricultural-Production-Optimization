import "./styles/tokens.scss";
import "./styles/main.scss";
import "./styles/site.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router";

import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { initAnalytics } from "./lib/analytics";
import { makeStore } from "./store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  },
});
const store = makeStore();

// Google Analytics is configured with VITE_GA_MEASUREMENT_ID (Vercel project env var).
// The Search Console verification meta tag is written into the static HTML at build time
// from VITE_GOOGLE_SITE_VERIFICATION (see vite.config.js), because Google reads raw HTML.
initAnalytics();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
);
