import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Playwright: end-to-end tests against a production build.
// Browser → FastAPI calls are mocked with page.route, so the backend is optional.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // Set PW_CHANNEL=chrome (or msedge) to use an installed browser instead of
      // Playwright's downloaded Chromium, e.g. when Windows blocks unsigned binaries.
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
