import { expect, test } from "@playwright/test";

const user = { id: 1, email: "ravi@example.com", full_name: "Ravi Kumar", role: "farmer", created_at: "2026-11-13T00:00:00Z" };

test("home page links to every tool and the theme toggle remembers dark mode", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AgriOptima/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("right crop");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["Crop advisor", "Fertilizer", "Crops", "Planner", "Farms", "Assistant", "Insights"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
});

test("crop advisor validates, calls the API and shows ranked crops", async ({ page }) => {
  await page.route("**/api/recommend/crop", (route) =>
    route.fulfill({
      json: {
        method: "ml-model",
        top: [
          { crop: "rice", confidence: 0.95, season: "kharif", category: "cereal" },
          { crop: "jute", confidence: 0.04, season: "kharif", category: "fibre" },
          { crop: "papaya", confidence: 0.01, season: "perennial", category: "fruit" },
        ],
      },
    }),
  );
  await page.goto("/recommend");
  const form = page.getByRole("form", { name: "Crop recommendation" });
  await form.getByRole("button", { name: "Recommend crops" }).click();
  await expect(page.getByText("Nitrogen is required")).toBeVisible();

  await page.getByRole("button", { name: "Wet paddy field" }).click();
  await form.getByRole("button", { name: "Recommend crops" }).click();
  const results = page.getByRole("region", { name: "Recommended crops" });
  await expect(results.getByRole("link", { name: /Rice/ })).toBeVisible();
  await expect(results.getByText("ML model")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent recommendations" })).toBeVisible();
});

test("planner (Redux) adds a field, advances status and survives a reload", async ({ page }) => {
  await page.goto("/planner");
  const form = page.getByRole("form", { name: "Add field" });
  await form.getByLabel("Field name").fill("North plot");
  await form.getByLabel("Crop").selectOption("maize");
  await form.getByLabel(/Area/).fill("2.5");
  await form.getByRole("button", { name: "Add field" }).click();

  const item = page.getByRole("listitem").filter({ hasText: "North plot" });
  await expect(item).toContainText("Maize · 2.5 ha · Kharif");
  await item.getByRole("button", { name: /Advance status/ }).click();
  await expect(item).toContainText("sown");
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: "North plot" })).toContainText("sown");
});

test("protected farms page: sign in, then see farms from the Node service", async ({ page }) => {
  await page.route("**/api/auth/token", async (route) => {
    expect(route.request().postData()).toContain("username=ravi%40example.com");
    await route.fulfill({ json: { access_token: "test-token", token_type: "bearer", expires_in: 3600, user } });
  });
  await page.route("**/farm-api/farms", (route) => {
    expect(route.request().headers().authorization).toBe("Bearer test-token");
    return route.fulfill({ json: [{ _id: "f1", name: "Green Acres", fields: 0, areaHa: 0, createdAt: "2026-11-13" }] });
  });
  await page.route("**/farm-api/farms/f1/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/summary")
        ? { farm: { _id: "f1", name: "Green Acres" }, totals: { fields: 0, areaHa: 0 }, byCrop: [], byStatus: {}, recentActivities: [] }
        : [],
    }),
  );

  await page.goto("/farms");
  await expect(page).toHaveURL(/\/login\?next=%2Ffarms$/);
  await page.getByLabel("Email").fill("ravi@example.com");
  await page.getByLabel("Password").fill("green123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/farms$/);
  await expect(page.getByRole("heading", { name: "Green Acres" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("assistant streams tokens, tool steps and sources", async ({ page }) => {
  await page.route("**/api/assistant/status", (route) =>
    route.fulfill({ json: { llm_available: true, llm_reason: "ok", model: "claude-opus-5-5", agent_runtime: "langgraph", vector_store: "qdrant", embedder: "tfidf", documents: 24 } }),
  );
  await page.route("**/api/assistant/chat", (route) => {
    const events = [
      { type: "tool", name: "search_knowledge", input: { query: "urea" } },
      { type: "tool_result", name: "search_knowledge", is_error: false },
      { type: "sources", sources: [{ source: "fertilizers-india", title: "Common fertilizers in India" }] },
      { type: "token", text: "Urea contains **46% nitrogen** " },
      { type: "token", text: "[fertilizers-india]." },
      { type: "done" },
    ];
    return route.fulfill({
      headers: { "Content-Type": "text/event-stream" },
      body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
    });
  });

  await page.goto("/assistant");
  await expect(page.getByText("Claude · claude-opus-5-5")).toBeVisible();
  await page.getByLabel("Message").fill("How much nitrogen is in urea?");
  await page.getByRole("button", { name: "Send" }).click();

  const turn = page.getByTestId("assistant-turn");
  await expect(turn).toContainText("Urea contains 46% nitrogen [fertilizers-india].");
  await expect(turn.locator("strong")).toHaveText("46% nitrogen");
  await expect(turn.getByText("Searched the knowledge base")).toBeVisible();
  await expect(turn.getByRole("list", { name: "Sources" })).toContainText("fertilizers-india");
});
