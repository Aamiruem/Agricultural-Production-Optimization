// Full-stack QA: real FastAPI (:8011, throwaway SQLite) behind the production build (:4190).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4190";
const OUT = process.argv[2];
const email = `qa${Date.now()}@example.com`;
const log = (...a) => console.log("•", ...a);

for (let i = 0; i < 60; i++) {
  try {
    const [a, w] = await Promise.all([fetch("http://localhost:8011/api/health"), fetch(BASE)]);
    if (a.ok && w.ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

// 1. Public home (signed out)
await page.goto(BASE + "/");
await page.waitForLoadState("networkidle");
log("home h1:", (await page.locator("h1").innerText()).replace(/\s+/g, " "));
log("sidebar on public home:", await page.locator(".app-shell, .side-nav").count());
await page.screenshot({ path: `${OUT}/01-home-desktop.png` });
await page.screenshot({ path: `${OUT}/01b-home-full.png`, fullPage: true });

// 2. Private API is refused without a token (backend enforcement, not just UI)
const r = await page.request.get(BASE + "/api/crops");
log("GET /api/crops without token ->", r.status());

// 3. Protected route -> login
await page.goto(BASE + "/dashboard");
await page.waitForURL("**/login?next=*");
await page.getByRole("heading", { name: "Welcome back" }).waitFor();
log("visit /dashboard signed out ->", new URL(page.url()).pathname + new URL(page.url()).search);
await page.screenshot({ path: `${OUT}/02-login.png` });

// 4. Register
await page.goto(BASE + "/register");
await page.getByLabel("Full name").fill("Asha Devi");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password", { exact: true }).fill("firstpass123");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/dashboard");
await page.waitForLoadState("networkidle");
log("after register ->", new URL(page.url()).pathname, "| h1:", await page.locator("h1").innerText());
await page.screenshot({ path: `${OUT}/03-dashboard.png` });

// 5. Private API now works with the token the app stored
const token = await page.evaluate(() => JSON.parse(localStorage.getItem("agri-auth")).state.token);
const r2 = await page.request.get(BASE + "/api/crops", { headers: { Authorization: `Bearer ${token}` } });
log("GET /api/crops with token ->", r2.status());

// 6. Settings: rename
await page.goto(BASE + "/settings");
await page.getByLabel("Full name").fill("Asha Kumari");
await page.getByRole("button", { name: "Save profile" }).click();
log("profile:", await page.getByRole("status").first().innerText());
await page.screenshot({ path: `${OUT}/04-settings.png`, fullPage: true });

// 7. Sign out
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(BASE + "/");
log("after sign out ->", new URL(page.url()).pathname, "| stored token:", await page.evaluate(() => JSON.parse(localStorage.getItem("agri-auth") || "{}").state?.token ?? null));

// 8. Forgot password -> dev reset link (no SMTP configured)
await page.goto(BASE + "/forgot-password");
await page.getByLabel("Email").fill(email);
await page.getByRole("button", { name: "Send reset link" }).click();
const link = page.getByRole("note").getByRole("link");
await link.waitFor();
const resetUrl = await link.getAttribute("href");
log("dev reset link:", resetUrl.replace(/token=.*/, "token=…"));
await page.screenshot({ path: `${OUT}/05-forgot.png` });

// 9. Reset
await page.goto(resetUrl.replace(/^https?:\/\/[^/]+/, BASE));
await page.getByLabel("New password", { exact: true }).fill("secondpass456");
await page.getByLabel("Confirm new password").fill("secondpass456");
await page.getByRole("button", { name: "Save new password" }).click();
log("reset:", await page.locator("h1").innerText());
// reusing the same link must fail (single-use)
await page.goto(resetUrl.replace(/^https?:\/\/[^/]+/, BASE));
await page.getByLabel("New password", { exact: true }).fill("thirdpass789");
await page.getByLabel("Confirm new password").fill("thirdpass789");
await page.getByRole("button", { name: "Save new password" }).click();
log("reuse reset link:", await page.getByRole("alert").first().innerText());

// 10. Old password fails, new one works
await page.goto(BASE + "/login");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password", { exact: true }).fill("firstpass123");
await page.getByRole("button", { name: "Login" }).click();
log("old password:", await page.getByRole("alert").first().innerText());
await page.getByLabel("Password", { exact: true }).fill("secondpass456");
await page.getByRole("button", { name: "Login" }).click();
await page.waitForURL("**/dashboard");
log("new password ->", new URL(page.url()).pathname, "| h1:", await page.locator("h1").innerText());

// 11. Contact form against the real API
await page.goto(BASE + "/contact");
const form = page.getByRole("form", { name: "Send a message" });
await form.getByLabel("Name").fill("QA Tester");
await form.getByLabel("Email").fill(email);
await form.getByLabel("Subject").fill("QA check");
await form.getByLabel("Message").fill("Testing the contact form end to end.");
await form.getByRole("button", { name: "Send message" }).click();
log("contact:", await page.getByRole("status").first().innerText());

// 12. Mobile views
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(BASE + "/");
await mp.waitForLoadState("networkidle");
await mp.screenshot({ path: `${OUT}/06-home-mobile.png` });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
log("mobile horizontal overflow px:", overflow);
await mp.goto(BASE + "/login");
await mp.screenshot({ path: `${OUT}/07-login-mobile.png` });

log("console errors:", errors.length ? errors : "none");
await browser.close();
