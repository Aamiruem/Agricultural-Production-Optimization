import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ALL_LINKS } from "@/layouts/navigation";

import {
  CROP_SEASONS,
  FORMULAS,
  GLOSSARY,
  ML_APPLICATIONS,
  ML_STATUS,
  PIPELINE,
  PRACTICES,
  YIELD_FACTORS,
} from "./agronomy";
import { DISEASES, SEASON_ORDER, filterDiseases, rankDiseases } from "./diseases";
import { STATES } from "./indiaAgri";

const PUBLIC = join(__dirname, "..", "..", "public");
const APP_ROUTES = new Set(
  [
    ...ALL_LINKS.map((l) => l.to),
    ...readFileSync(join(__dirname, "..", "App.jsx"), "utf8").matchAll(/path="([^"*:]+)"/g),
  ].map((m) => (typeof m === "string" ? m : `/${m[1]}`)),
);

describe("regional disease library", () => {
  const stateNames = new Set(STATES.map((s) => s.name));

  it("uses real state names, seasons and complete descriptions", () => {
    for (const d of DISEASES) {
      expect(
        d.states.every((s) => s === "*" || stateNames.has(s)),
        `${d.id} states`,
      ).toBe(true);
      expect(
        d.seasons.every((s) => SEASON_ORDER.includes(s)),
        `${d.id} seasons`,
      ).toBe(true);
      for (const field of ["pathogen", "conditions", "signs", "spread"])
        expect(d[field], `${d.id}.${field}`).toBeTruthy();
    }
    expect(new Set(DISEASES.map((d) => d.id)).size).toBe(DISEASES.length);
  });

  it("filters by state and season", () => {
    const rajasthanRabi = filterDiseases({ state: "Rajasthan", season: "Rabi" }).map((d) => d.id);
    expect(rajasthanRabi).toContain("white-rust");
    expect(rajasthanRabi).not.toContain("sigatoka"); // banana leaf spot is a southern/eastern problem
    expect(filterDiseases({ state: "Kerala" }).map((d) => d.id)).toContain("sigatoka");
  });

  it("the same symptoms point to different problems in different states", () => {
    // Yellowing + wilting in Kharif rice fits both planthopper and bacterial blight.
    const base = { crop: "Rice", symptoms: ["yellowing", "wilting"], season: "Kharif" };
    expect(rankDiseases({ ...base, state: "Kerala" })[0].id).toBe("brown-planthopper"); // BPH hotspot, not BLB
    expect(rankDiseases({ ...base, state: "Bihar" })[0].id).toBe("bacterial-blight"); // BLB hotspot, not BPH
  });
});

describe("knowledge hub", () => {
  it("covers the full pipeline and reference sections", () => {
    expect(PIPELINE).toHaveLength(8);
    expect(GLOSSARY).toHaveLength(10);
    expect(PRACTICES).toHaveLength(12);
    expect(YIELD_FACTORS.flatMap((f) => f.items)).toHaveLength(14);
  });

  it("formulas compute the textbook results", () => {
    const run = (id, values) => FORMULAS.find((f) => f.id === id).compute(values);
    expect(run("yield", { production: 45, area: 10 })).toBe(4.5);
    expect(run("intensity", { gross: 15, net: 10 })).toBe(150);
    expect(run("harvest-index", { economic: 4.5, biological: 10 })).toBe(45);
    expect(run("wue", { yieldKg: 4500, water: 450 })).toBe(10);
    expect(run("growth", { current: 52, previous: 45 })).toBe(15.6);
    expect(run("fertilizer", { dose: 120, fraction: 0.46 })).toBe(260.9);
    expect(run("yield", { production: 10, area: 0 })).toBeNull(); // no division by zero
  });

  it("every image exists and every in-app link points at a real page", () => {
    for (const s of CROP_SEASONS) expect(existsSync(join(PUBLIC, s.image)), s.image).toBe(true);
    const links = [
      ...PIPELINE.map((p) => p.link?.to),
      ...GLOSSARY.map((g) => g.link),
      ...PRACTICES.map((p) => p.link),
      ...YIELD_FACTORS.map((f) => f.link),
      ...ML_APPLICATIONS.map((a) => a.link),
    ].filter(Boolean);
    for (const to of links) expect(APP_ROUTES.has(to), to).toBe(true);
    for (const a of ML_APPLICATIONS) expect(ML_STATUS[a.status], a.task).toBeDefined();
  });
});
