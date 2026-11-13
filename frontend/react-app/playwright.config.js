import { defineConfig, devices } from "@playwright/test";

const PORT = 4180;

// End-to-end tests against the production build (`vite preview`).
// API calls are mocked with page.route, so no backend is needed.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    {
      name: "chromium",
      // PW_CHANNEL=chrome uses the installed Chrome (e.g. when Windows blocks Playwright's own Chromium).
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
