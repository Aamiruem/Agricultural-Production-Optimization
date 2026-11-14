import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { resetBreakers } from "./lib/api.js";

const STATUS = {
  status: "degraded",
  instance: "api-1:101",
  environment: "test",
  runtime: { python: "3.12", platform: "Linux" },
  services: [
    { name: "api", status: "ok", latency_ms: 0, instance: "api-1:101", details: { database: "ok" } },
    {
      name: "farm-service",
      status: "ok",
      latency_ms: 3.2,
      details: { instance: "farm-1:7", realtime: { adapter: "redis" } },
    },
    { name: "mcp", status: "down", latency_ms: 2000, error: "ConnectError" },
  ],
  models: {
    crop: { method: "ml-model", model: "random_forest", metrics: { test_accuracy: 0.993 } },
    yield: { loaded: true, model: "xgboost", metrics: { r2_log: 0.9, mae_t_ha: 1.31 } },
  },
  assistant: { llm_available: false },
  caches: [{ name: "crop_recommendation", size: 3, maxsize: 4096, ttl_s: 900, hits: 5, misses: 3, hit_rate: 0.625 }],
  load: { instance: "api-1:101", requests_per_s_1m: 1.5, latency_ms: { p50: 2, p95: 9, p99: 20 }, max_concurrency: 64 },
  queue: { broker: "redis" },
};

function routeFetch(url) {
  const u = String(url);
  const ok = (body) =>
    Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
    );
  if (u.includes("/api/system/status")) return ok(STATUS);
  if (u.includes("/api/system/metrics"))
    return ok({
      ...STATUS.load,
      requests_total: 10,
      in_flight: 1,
      peak_in_flight: 3,
      rejected_total: 0,
      uptime_s: 60,
      status: { "2xx": 9, "4xx": 1 },
      top_routes: [],
    });
  if (u.includes("/api/yield/coverage"))
    return ok({ states: ["Punjab"], crops: ["Wheat"], seasons: ["Rabi"], state_crops: [["Punjab", "Wheat"]] });
  if (u.includes("/api/yield/trend"))
    return ok({
      points: [
        { year: 2019, yield_t_ha: 4.8, production_t: 10, area_ha: 2, records: 1 },
        { year: 2020, yield_t_ha: 5.1, production_t: 11, area_ha: 2, records: 1 },
      ],
    });
  return Promise.reject(new TypeError("Failed to fetch")); // every other service is "down"
}

function renderAt(path) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("console", () => {
  beforeEach(() => {
    resetBreakers();
    vi.stubGlobal("fetch", vi.fn(routeFetch));
    vi.stubGlobal(
      "WebSocket",
      class {
        constructor() {
          setTimeout(() => this.onclose?.(), 0);
        }
        close() {}
        send() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the overview with live status and model KPIs", async () => {
    renderAt("/");
    expect(await screen.findByText("99.3%", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("0.900")).toBeInTheDocument();
    expect(await screen.findByText("Partially degraded", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getAllByText("Down").length).toBeGreaterThan(0); // the MCP probe
  });

  it.each(["/studio", "/yield", "/models", "/farms", "/assistant", "/mcp-tools", "/system", "/login", "/nope"])(
    "%s renders without crashing when services are down",
    async (path) => {
      renderAt(path);
      expect(await screen.findByRole("main", {}, { timeout: 5000 })).toBeInTheDocument();
      // wait for the lazy page chunk to replace the skeleton, then let its requests settle
      await waitFor(() => expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument(), { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 50));
      expect(screen.queryByText(/unexpected error/i)).not.toBeInTheDocument();
    },
  );

  it("asks for sign-in on the farms page", async () => {
    renderAt("/farms");
    expect(await screen.findByText("Sign in to see your farms", {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
