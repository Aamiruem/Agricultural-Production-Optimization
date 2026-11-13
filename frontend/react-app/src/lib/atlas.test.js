import { describe, expect, it } from "vitest";

import { CROPS, STATES } from "@/data/indiaAgri";

import { YIELD_DOMAIN } from "./agriModels";
import { ATLAS_CROPS, ATLAS_STATES, advisorSeason, atlasCrop, cropImage, recommendRotation, recommendSeasonalCrops } from "./atlas";
import { parseCsv, scoreRows } from "./yieldBatch";

describe("crop photos", () => {
  it("has 45 crops, each with a photo path", () => {
    expect(ATLAS_CROPS).toHaveLength(45);
    expect(ATLAS_CROPS.every((c) => c.image.startsWith("/images/crops/") && c.hi)).toBe(true);
  });

  it("matches names used across the app", () => {
    expect(atlasCrop("bajra")?.name).toBe("Pearl Millet");
    expect(atlasCrop("Arhar/Tur")?.name).toBe("Pigeon Pea");
    expect(atlasCrop("Moong(Green Gram)")?.name).toBe("Green Gram");
    expect(atlasCrop("Rapeseed &Mustard")?.name).toBe("Mustard");
    expect(atlasCrop("Cotton(lint)")?.name).toBe("Cotton");
    expect(atlasCrop("pigeonpeas")?.name).toBe("Pigeon Pea");
    expect(cropImage("Dragonfruit")).toBeUndefined();
  });

  it("gives photos to most yield-model and catalogue crops", () => {
    // Every major yield-model crop with a source photo resolves (aggregates like "Other Cereals" have none).
    for (const c of ["Rice", "Wheat", "Maize", "Bajra", "Jowar", "Ragi", "Gram", "Arhar/Tur", "Urad", "Masoor", "Groundnut", "Soyabean", "Sesamum", "Sugarcane", "Cotton(lint)", "Jute", "Potato", "Onion", "Banana", "Coconut", "Turmeric", "Dry chillies", "Cashewnut", "Peas & beans (Pulses)"]) {
      expect(cropImage(c), c).toBeTruthy();
    }
    expect(YIELD_DOMAIN.crops.filter((c) => cropImage(c)).length).toBeGreaterThanOrEqual(33);
    expect(CROPS.filter((c) => cropImage(c.id)).length).toBeGreaterThanOrEqual(40);
  });

  it("covers every state and UT with climate references", () => {
    for (const s of STATES) expect(ATLAS_STATES[s.name], s.name).toBeDefined();
  });
});

describe("seasonal advisor", () => {
  it("uses the same season rule as the Streamlit app", () => {
    expect(advisorSeason(7)).toBe("Kharif");
    expect(advisorSeason(12)).toBe("Rabi");
    expect(advisorSeason(4)).toBe("Zaid");
  });

  it("ranks rice and wheat sensibly for Punjab", () => {
    const kharif = recommendSeasonalCrops({ state: "Punjab", season: "Kharif", soil: "Alluvial", water: "High" }).map((c) => c.name);
    expect(kharif.slice(0, 3)).toContain("Rice");
    const rabi = recommendSeasonalCrops({ state: "Punjab", season: "Rabi", soil: "Alluvial", water: "Medium" }).map((c) => c.name);
    expect(rabi.slice(0, 3)).toContain("Wheat");
    expect(rabi).not.toContain("Pearl Millet");
  });

  it("keeps scores within 0–100 and explains them", () => {
    const r = recommendSeasonalCrops({ state: "Kerala", season: "Kharif", soil: "Laterite", water: "High", topN: 45 });
    expect(r).toHaveLength(45);
    expect(r.every((c) => c.score >= 0 && c.score <= 100 && c.why.length)).toBe(true);
    const top = r[0];
    expect(Object.values(top.parts).reduce((a, b) => a + b, 0)).toBeCloseTo(top.score, 0);
  });
});

describe("rotation planner", () => {
  it("prefers a legume after rice in rabi on alluvial soil", () => {
    const r = recommendRotation({ previous: "Rice", season: "Rabi", soil: "Alluvial" });
    expect(r[0]).toMatchObject({ next: "Chickpea", total: 100 }); // 92 + 6 + 4, capped at 100
    expect(r).toHaveLength(3);
    expect(new Set(r.map((x) => x.next)).size).toBe(3);
    expect(r.some((x) => x.next === "Rice")).toBe(false);
  });

  it("falls back to general options when the guide has few matches", () => {
    const r = recommendRotation({ previous: "Sugarcane", season: "Kharif", soil: "Loamy" });
    expect(r).toHaveLength(3);
    expect(r.some((x) => x.fallback)).toBe(true);
  });
});

describe("batch CSV", () => {
  it("parses, scores and flags bad rows", () => {
    const rows = parseCsv("crop,state,season,year,area_ha,annual_rainfall\nWheat,Punjab,Rabi,2025,2,\nDragonfruit,Punjab,Rabi,2025,1,\n");
    const out = scoreRows(rows);
    expect(out[0].yield_t_ha).toBeGreaterThan(3.5);
    expect(out[0].production_t).toBeCloseTo(out[0].yield_t_ha * 2, 1);
    expect(out[1].yield_t_ha).toBe("");
    expect(out[1].note).toMatch(/No yield records/);
  });

  it("rejects files missing required columns", () => {
    expect(() => parseCsv("crop,state\nWheat,Punjab")).toThrow(/Missing column: season/);
    expect(() => parseCsv("crop,state,season,year,area_ha")).toThrow(/at least one data row/);
  });
});
