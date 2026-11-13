import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/layouts/navigation";
import { ICON_NAMES } from "@/lib/icons";
import { seasonalNotifications } from "@/lib/notifications";
import { translations } from "@/i18n/translations";

import { rankDiseases, DISEASES, SYMPTOMS } from "./diseases";
import { CATEGORIES, CROPS, SEASONS, SOIL_TYPES, STATES, cropsForState, datasetStateName } from "./indiaAgri";
import analytics from "./generated/analytics.json";

const ids = (list, key = "id") => new Set(list.map((x) => x[key]));

describe("India reference data", () => {
  it("covers 28 states and 8 union territories with unique slugs", () => {
    expect(STATES.filter((s) => s.type === "state")).toHaveLength(28);
    expect(STATES.filter((s) => s.type === "ut")).toHaveLength(8);
    expect(ids(STATES, "slug").size).toBe(STATES.length);
  });

  it("gives every state valid coordinates, soils and crops", () => {
    const soils = ids(SOIL_TYPES);
    for (const s of STATES) {
      expect(s.lat, s.name).toBeGreaterThan(6);
      expect(s.lat, s.name).toBeLessThan(37);
      expect(s.lon, s.name).toBeGreaterThan(68);
      expect(s.lon, s.name).toBeLessThan(98);
      expect(s.soils.every((x) => soils.has(x)), s.name).toBe(true);
      expect(s.kharif.length + s.rabi.length, s.name).toBeGreaterThan(0);
      expect(s.districts.length, s.name).toBeGreaterThan(0);
    }
  });

  it("keeps every crop's category, seasons, soils and states valid", () => {
    const cats = ids(CATEGORIES); const seasons = ids(SEASONS); const soils = ids(SOIL_TYPES);
    const states = new Set(STATES.map((s) => s.name));
    expect(ids(CROPS).size).toBe(CROPS.length);
    for (const c of CROPS) {
      expect(cats.has(c.category), c.id).toBe(true);
      expect(c.seasons.every((x) => seasons.has(x)), c.id).toBe(true);
      expect(c.soils.every((x) => soils.has(x)), c.id).toBe(true);
      const unknown = c.states.filter((x) => !states.has(x));
      expect(unknown, `${c.id} has unknown states`).toEqual([]);
    }
  });

  it("has crops in every category, including dry fruits and spices", () => {
    for (const cat of CATEGORIES) expect(CROPS.filter((c) => c.category === cat.id).length, cat.id).toBeGreaterThan(5);
    expect(cropsForState("Punjab").map((c) => c.id)).toEqual(expect.arrayContaining(["wheat", "rice"]));
  });

  it("maps state names to the historical dataset", () => {
    expect(analytics.states[datasetStateName("Jammu & Kashmir")]).toBeDefined();
    expect(analytics.states[datasetStateName("Punjab")]).toBeDefined();
  });
});

describe("disease knowledge base", () => {
  it("uses only known symptoms", () => {
    const known = ids(SYMPTOMS);
    for (const d of DISEASES) expect(d.symptoms.every((s) => known.has(s)), d.id).toBe(true);
  });

  it("ranks powdery mildew first for white powder on grapes", () => {
    const ranked = rankDiseases({ crop: "Grapes", symptoms: ["powdery"], pct: { healthy: 60, yellow: 5, brown: 0, dark: 0, white: 35 } });
    expect(ranked[0].id).toBe("powdery-mildew");
  });

  it("ranks late blight highly for dark rot on potato", () => {
    const ranked = rankDiseases({ crop: "Potato", symptoms: ["blight", "rot"], pct: { healthy: 50, yellow: 5, brown: 15, dark: 30, white: 0 } });
    expect(ranked[0].id).toBe("late-blight");
  });
});

describe("translations", () => {
  const keys = (obj, prefix = "") => Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
  it("has a Hindi string for every English key", () => {
    const hi = new Set(keys(translations.hi));
    expect(keys(translations.en).filter((k) => !hi.has(k))).toEqual([]);
  });
});

describe("icons", () => {
  it("only uses Material Symbols that are in the font subset", () => {
    const known = new Set(ICON_NAMES);
    const used = [...NAV_GROUPS.flatMap((g) => g.links.map((l) => l.icon)), ...[0, 3, 6].flatMap((m) => seasonalNotifications(m, "en").map((n) => n.icon))];
    expect(used.filter((n) => !known.has(n))).toEqual([]);
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
  });
});
