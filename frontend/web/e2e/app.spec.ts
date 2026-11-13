import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("has SEO metadata and links to every tool", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AgriOptima/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("right crop");

    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Crop advisor", "Fertilizer", "Crop library", "Farm planner"]) {
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
