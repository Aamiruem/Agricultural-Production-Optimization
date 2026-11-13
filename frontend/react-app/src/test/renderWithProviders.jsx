import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";

import { ThemeProvider } from "@/context/ThemeContext.jsx";
import { LanguageProvider } from "@/i18n/LanguageContext.jsx";
import { makeStore } from "@/store";

/** Render with the same providers as the app (fresh store and query cache per test). */
export function renderWithProviders(ui, { route = "/" } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>,
  );
}
