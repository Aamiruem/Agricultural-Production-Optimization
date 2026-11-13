import "./styles/main.scss";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router";

import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { makeStore } from "./store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  },
});
const store = makeStore();

// Analytics is opt-in: set VITE_GA_MEASUREMENT_ID in the Vercel project settings.
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
const searchVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
if (searchVerification) {
  const verificationMeta = document.createElement("meta");
  verificationMeta.name = "google-site-verification";
  verificationMeta.content = searchVerification;
  document.head.appendChild(verificationMeta);
}
if (measurementId && typeof window !== "undefined") {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });
  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(analyticsScript);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </StrictMode>,
);
