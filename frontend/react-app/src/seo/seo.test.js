import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { AI_SOLUTIONS } from "@/data/content/aiSolutions";
import { FOOD_GALLERY } from "@/data/content/cropsFood";
import { EDUCATION_TOPICS } from "@/data/content/education";
import { HEALTH_GALLERY, HEALTH_TOPICS } from "@/data/content/health";
import { MACHINES } from "@/data/content/machines";
import { NUTRITION_CATEGORIES } from "@/data/content/nutrition";
import { PRODUCTION_SYSTEMS } from "@/data/content/productionSystems";
import { PRODUCTION_SYSTEM_INDEX } from "@/data/content/productionSystemsIndex";

import { breadcrumbTrail, REDIRECTS, routeSeo, SEO_ROUTES } from "./routes";
import { structuredData } from "./structuredData";

const ROOT = path.resolve(__dirname, "../..");
const indexable = SEO_ROUTES.filter((r) => !r.noindex);

describe("SEO registry", () => {
  it("gives every indexable page a unique title and description of sensible length", () => {
    const titles = new Set();
    const descriptions = new Set();
    for (const r of indexable) {
      expect(r.title.length, r.path).toBeLessThanOrEqual(70);
      expect(r.description.length, r.path).toBeGreaterThanOrEqual(70);
      expect(r.description.length, r.path).toBeLessThanOrEqual(175);
      expect(titles.has(r.title), `duplicate title ${r.title}`).toBe(false);
      expect(descriptions.has(r.description), `duplicate description on ${r.path}`).toBe(false);
      titles.add(r.title);
      descriptions.add(r.description);
    }
  });

  it("registers every route declared in App.jsx", () => {
    const app = readFileSync(path.join(ROOT, "src/App.jsx"), "utf8");
    const paths = [...app.matchAll(/path="([^"]+)"/g)]
      .map((m) => `/${m[1]}`)
      .filter((p) => !p.includes(":") && p !== "/*");
    for (const p of paths) expect(routeSeo(p), p).toBeDefined();
    expect(routeSeo("/")).toBeDefined();
  });

  it("keeps vercel.json redirects in sync with REDIRECTS", () => {
    const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    const hosted = Object.fromEntries(vercel.redirects.map((r) => [r.source, r.destination]));
    expect(hosted).toEqual(REDIRECTS);
    expect(vercel.rewrites).toBeUndefined(); // unknown URLs must return a real 404
  });

  it("builds breadcrumbs from the home page", () => {
    expect(breadcrumbTrail("/agricultural-production-systems/organic-farming").map((c) => c.path)).toEqual([
      "/",
      "/agricultural-production-systems",
      "/agricultural-production-systems/organic-farming",
    ]);
  });

  it("has an Open Graph JPEG for every page", () => {
    for (const r of SEO_ROUTES) expect(existsSync(path.join(ROOT, "public", r.image)), r.image).toBe(true);
  });
});

describe("structured data", () => {
  it("never claims ratings, reviews or awards", () => {
    for (const r of indexable) {
      const json = JSON.stringify(structuredData("https://example.org", r.path));
      expect(json).not.toMatch(/aggregateRating|"review"|award/i);
    }
  });

  it("marks content guides as Articles with author and publisher", () => {
    const ld = structuredData("https://example.org", "/ai-in-agriculture");
    const article = ld["@graph"].find((n) => n["@type"] === "Article");
    expect(article.author["@id"]).toContain("#person");
    expect(article.publisher["@id"]).toContain("#organization");
  });

  it("returns nothing for noindex or unknown pages", () => {
    expect(structuredData("https://example.org", "/farms")).toBeNull();
    expect(structuredData("https://example.org", "/nope")).toBeNull();
  });
});

describe("content data", () => {
  it("keeps the lightweight production-system index in sync with the full content", () => {
    expect(PRODUCTION_SYSTEM_INDEX).toEqual(
      PRODUCTION_SYSTEMS.map(({ slug, title, summary, image }) => ({ slug, title, summary, image })),
    );
  });

  it("covers every required topic with complete fields", () => {
    expect(PRODUCTION_SYSTEMS).toHaveLength(16);
    for (const s of PRODUCTION_SYSTEMS) {
      for (const k of ["definition", "importance", "india"]) expect(s[k], `${s.slug}.${k}`).toBeTruthy();
      for (const k of ["process", "advantages", "limitations"])
        expect(s[k].length, `${s.slug}.${k}`).toBeGreaterThan(2);
      for (const rel of s.related)
        expect(
          PRODUCTION_SYSTEMS.some((x) => x.slug === rel),
          rel,
        ).toBe(true);
    }
    expect(MACHINES).toHaveLength(12);
    expect(AI_SOLUTIONS).toHaveLength(12);
    expect(NUTRITION_CATEGORIES).toHaveLength(8);
    expect(EDUCATION_TOPICS).toHaveLength(10);
  });

  it("references only images that exist, with alt text", () => {
    const items = [
      ...PRODUCTION_SYSTEMS,
      ...MACHINES,
      ...AI_SOLUTIONS.filter((a) => a.image),
      ...FOOD_GALLERY,
      ...HEALTH_GALLERY,
      ...HEALTH_TOPICS.filter((h) => h.image),
      ...NUTRITION_CATEGORIES,
      ...EDUCATION_TOPICS.filter((e) => e.image),
    ];
    for (const it of items) {
      expect(it.alt?.length, `alt for ${it.image}`).toBeGreaterThan(10);
      for (const w of [640, 1200]) {
        expect(existsSync(path.join(ROOT, `public/images/${it.image}-${w}.webp`)), `${it.image}-${w}`).toBe(true);
      }
    }
  });

  it("credits every downloaded photo", () => {
    const credits = JSON.parse(readFileSync(path.join(ROOT, "src/data/generated/imageCredits.json"), "utf8"));
    for (const [key, c] of Object.entries(credits)) {
      expect(c.license, key).toMatch(/^(CC0|CC BY|Public domain|PD)/i);
      expect(c.page, key).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });
});
