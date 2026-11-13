import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("has SEO metadata and links to every tool", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AgriOptima/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("right crop");

    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Crop advisor", "Fertilizer", "Crops", "Planner", "Farms", "Assistant", "Insights"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("theme toggle switches to dark mode and remembers it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  });
});

test("crop advisor submits readings and shows ranked crops", async ({ page }) => {
  await page.route("**/api/recommend/crop", async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({ N: 85, ph: 6.5 });
    await route.fulfill({
      json: {
        method: "profile-similarity",
        top: [
          { crop: "rice", confidence: 0.7, season: "kharif", category: "cereal" },
          { crop: "jute", confidence: 0.2, season: "kharif", category: "fibre" },
          { crop: "papaya", confidence: 0.1, season: "perennial", category: "fruit" },
        ],
      },
    });
  });

  await page.goto("/recommend");
  await page.getByRole("button", { name: "Recommend crops" }).click();
  await expect(page.getByText("Nitrogen is required")).toBeVisible();

  await page.getByRole("button", { name: "Wet paddy field" }).click();
  await page.getByRole("button", { name: "Recommend crops" }).click();

  const results = page.getByRole("region", { name: "Recommended crops" });
  await expect(results.getByRole("link", { name: /Rice/ })).toBeVisible();
  await expect(results.getByText("70%")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent recommendations" })).toBeVisible();
});

test("farm planner adds a field, advances status and persists after reload", async ({ page }) => {
  await page.goto("/planner");
  await page.getByLabel("Field name").fill("North plot");

  await page.getByRole("combobox", { name: "Crop" }).click();
  await page.getByRole("option", { name: "Maize" }).click();
  await page.getByLabel(/Area/).fill("2.5");
  await page.getByRole("button", { name: "Add field" }).click();

  const item = page.getByRole("listitem").filter({ hasText: "North plot" });
  await expect(item).toContainText("Maize · 2.5 ha · Kharif");
  await expect(page.getByText("2.5 ha").first()).toBeVisible();

  await item.getByRole("button", { name: /Advance status/ }).click();
  await expect(item).toContainText("sown");

  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: "North plot" })).toContainText("sown");
});

test("sign in stores the session and unlocks the farms page", async ({ page }) => {
  const user = { id: 1, email: "ravi@example.com", full_name: "Ravi Kumar", role: "farmer", created_at: "2026-11-13T00:00:00Z" };
  await page.route("**/api/auth/token", async (route) => {
    expect(route.request().postData()).toContain("username=ravi%40example.com");
    await route.fulfill({ json: { access_token: "test-token", token_type: "bearer", expires_in: 3600, user } });
  });
  await page.route("**/api/farms", (route) =>
    route.fulfill({ json: [{ _id: "f1", name: "Green Acres", fields: 0, areaHa: 0, createdAt: "2026-11-13" }] }),
  );
  await page.route("**/api/farms/f1/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/summary")
        ? { farm: { _id: "f1", name: "Green Acres" }, totals: { fields: 0, areaHa: 0 }, byCrop: [], byStatus: {}, recentActivities: [] }
        : [],
    }),
  );

  await page.goto("/farms");
  await expect(page.getByText("Sign in to manage your farms.")).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Sign in" }).click();

  await page.getByLabel("Email").fill("ravi@example.com");
  await page.getByLabel("Password").fill("green123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/farms$/);
  await expect(page.getByRole("heading", { name: "Green Acres" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("assistant streams tokens, tool steps and sources", async ({ page }) => {
  await page.route("**/api/assistant/status", (route) =>
    route.fulfill({
      json: { llm_available: true, llm_reason: "ok", model: "claude-opus-5-5", agent_runtime: "langgraph",
              vector_store: "qdrant", embedder: "tfidf", documents: 21 },
    }),
  );
  await page.route("**/api/assistant/chat", (route) => {
    const events = [
      { type: "tool", name: "search_knowledge", input: { query: "urea" } },
      { type: "tool_result", name: "search_knowledge", is_error: false },
      { type: "sources", sources: [{ source: "fertilizers-india", title: "Common fertilizers in India" }] },
      { type: "token", text: "Urea contains 46% nitrogen " },
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
  await expect(turn.getByText("Searched the knowledge base")).toBeVisible();
  await expect(turn.getByRole("list", { name: "Sources" })).toContainText("fertilizers-india");
});
