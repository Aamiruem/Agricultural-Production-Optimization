import { expect, test } from "@playwright/test";

const USER = {
  id: 7,
  email: "asha@example.com",
  full_name: "Asha Devi",
  role: "user",
  created_at: "2026-11-01T00:00:00Z",
};

/**
 * Any API call a test does not mock answers 503, so pages use their honest offline paths and
 * never reach a real backend (a real one would reject the fake token and sign the test out).
 */
async function isolateApi(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { detail: "offline in e2e" } }));
}

/** Start the page already signed in (same shape the app persists after a real login). */
async function signIn(page) {
  await page.addInitScript((user) => {
    localStorage.setItem(
      "agri-auth",
      JSON.stringify({ state: { token: "e2e-token", user, expiresAt: Date.now() + 3_600_000 }, version: 0 }),
    );
  }, USER);
}

test("public home page: hero, navigation, CTAs and no internal tools", async ({ page }) => {
  await isolateApi(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/AgriSmart/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Grow Smarter");
  const nav = page.getByRole("navigation", { name: "Primary" });
  for (const label of ["Home", "About", "Features", "AI Solutions", "How It Works", "Contact"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Login", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore AgriSmart" }).first()).toBeVisible();
  // Signed-out visitors see no dashboard sidebar or app shell.
  await expect(page.locator(".app-shell, .side-nav")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chat with AgriSmart on WhatsApp" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/919931879953/,
  );

  await page.getByRole("button", { name: "Toggle dark mode" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-bs-theme", "dark");
});

test("private pages send signed-out visitors to login and return them after sign-in", async ({ page }) => {
  await isolateApi(page);
  await page.route("**/api/auth/token", (route) =>
    route.fulfill({ json: { access_token: "jwt", token_type: "bearer", expires_in: 3600, user: USER } }),
  );
  await page.goto("/weather");
  await expect(page).toHaveURL(/\/login\?next=%2Fweather$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Enter a valid email")).toBeVisible();

  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/weather$/);
  await expect(page.locator(".app-shell")).toBeVisible();
});

test("login shows the API's error and never fakes success", async ({ page }) => {
  await isolateApi(page);
  await page.route("**/api/auth/token", (route) =>
    route.fulfill({ status: 401, json: { detail: "Incorrect email or password" } }),
  );
  await page.goto("/login");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-pass1");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("alert")).toContainText("Incorrect email or password");
  await expect(page).toHaveURL(/\/login$/);
});

test("signed-in dashboard: welcome, sidebar and honest empty overview", async ({ page }) => {
  await isolateApi(page);
  await signIn(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back, Asha");
  await expect(page.getByRole("heading", { name: "Your latest analysis" })).toBeVisible();
  await expect(page.getByText("No location analysed yet.")).toBeVisible();

  // Signed-in users skip the login screen.
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("crop advisor validates, calls the API and shows ranked crops", async ({ page }) => {
  await isolateApi(page);
  await signIn(page);
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
  await expect(page).toHaveURL(/\/crop-recommendation$/);
  const form = page.getByRole("form", { name: "Crop recommendation" });
  await form.getByRole("button", { name: "Recommend crops" }).click();
  await expect(page.getByText("Nitrogen is required")).toBeVisible();

  await page.getByRole("button", { name: "Wet paddy field" }).click();
  await form.getByRole("button", { name: "Recommend crops" }).click();
  const results = page.getByRole("region", { name: "Recommended crops" });
  await expect(results.getByRole("link", { name: /Rice/ })).toBeVisible();
  await expect(results.getByText("ML model")).toBeVisible();
});

test("planner (Redux) adds a field, advances status and survives a reload", async ({ page }) => {
  await isolateApi(page);
  await signIn(page);
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

test("contact form validates and reports a real server result", async ({ page }) => {
  await isolateApi(page);
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 201, json: { id: 42, detail: "Thanks — your message has been received." } }),
  );
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();

  const form = page.getByRole("form", { name: "Send a message" });
  await form.getByLabel("Name").fill("Asha Devi");
  await form.getByLabel("Email").fill("asha@example.com");
  await form.getByLabel("Subject").fill("Soil data");
  await form.getByLabel("Message").fill("Is district soil data available for Bihar?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Reference #42");
});

test("assistant streams tokens, tool steps and sources", async ({ page }) => {
  await isolateApi(page);
  await signIn(page);
  await page.route("**/api/assistant/status", (route) =>
    route.fulfill({
      json: {
        llm_available: true,
        llm_reason: "ok",
        model: "claude-opus-5-5",
        agent_runtime: "langgraph",
        vector_store: "qdrant",
        embedder: "tfidf",
        documents: 24,
      },
    }),
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
