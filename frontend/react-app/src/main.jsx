import "./styles/main.scss";

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

// Google Search Console verification and Google Analytics are configured with
// VITE_GOOGLE_SITE_VERIFICATION and VITE_GA_MEASUREMENT_ID (Vercel project env vars).
const searchVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
if (searchVerification) {
  const verificationMeta = document.createElement("meta");
  verificationMeta.name = "google-site-verification";
  verificationMeta.content = searchVerification;
  document.head.appendChild(verificationMeta);
}
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
