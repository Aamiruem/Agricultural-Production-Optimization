import { describe, expect, it } from "vitest";

import {
  YIELD_DOMAIN,
  analyzeLeafPixels,
  fertilizerLocal,
  irrigationPlan,
  predictYieldLocal,
  rainfallSensitivity,
  recommendLocal,
  seasonsFor,
  soilHealth,
} from "./agriModels";

const pixels = (rgb, n = 400) => {
  const data = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i += 1) data.set([...rgb, 255], i * 4);
  return data;
};

describe("yield model (browser)", () => {
  it("predicts realistic wheat yields for major states", () => {
    const mp = predictYieldLocal({ state: "Madhya Pradesh", crop: "Wheat", season: "Rabi", year: 2019, area_ha: 2 });
    const pb = predictYieldLocal({ state: "Punjab", crop: "Wheat", season: "Rabi", year: 2019, area_ha: 2 });
    // Recorded 2019 yields: MP 3.52 t/ha, Punjab 4.89 t/ha.
    expect(mp.yield_t_ha).toBeGreaterThan(2.5);
    expect(mp.yield_t_ha).toBeLessThan(4.5);
    expect(pb.yield_t_ha).toBeGreaterThan(4);
    expect(pb.yield_t_ha).toBeLessThan(6);
    expect(pb.yield_t_ha).toBeGreaterThan(mp.yield_t_ha);
  });

  it("scales production with area and returns a band around the estimate", () => {
    const r = predictYieldLocal({ state: "Punjab", crop: "Rice", season: "Kharif", year: 2020, area_ha: 3 });
    expect(r.production_t).toBeCloseTo(r.yield_t_ha * 3, 1);
    expect(r.low_t_ha).toBeLessThan(r.yield_t_ha);
    expect(r.high_t_ha).toBeGreaterThan(r.yield_t_ha);
    expect(r.history?.n).toBeGreaterThan(5);
  });

  it("only offers seasons with records and rejects unknown crops", () => {
    expect(seasonsFor("Punjab", "Wheat")).toContain("Rabi");
    expect(seasonsFor("Punjab", "Wheat")).not.toContain("Kharif");
    expect(() =>
      predictYieldLocal({ state: "Punjab", crop: "Dragonfruit", season: "Rabi", year: 2020, area_ha: 1 }),
    ).toThrow();
    expect(YIELD_DOMAIN.states.length).toBeGreaterThanOrEqual(30);
  });

  it("produces a monotonic rainfall response", () => {
    const curve = rainfallSensitivity({
      state: "Madhya Pradesh",
      crop: "Wheat",
      season: "Rabi",
      year: 2020,
      area_ha: 1,
    });
    expect(curve).toHaveLength(9);
    const ys = curve.map((p) => p.yield);
    const rising = ys.every((y, i) => i === 0 || y >= ys[i - 1]);
    const falling = ys.every((y, i) => i === 0 || y <= ys[i - 1]);
    expect(rising || falling).toBe(true);
  });
});

describe("crop recommendation (browser Naive Bayes)", () => {
  it("ranks rice first for a wet paddy profile", () => {
    const r = recommendLocal({ N: 85, P: 45, K: 40, temperature: 23.5, humidity: 82, ph: 6.5, rainfall: 230 });
    expect(r.top[0].crop).toBe("rice");
    expect(r.top).toHaveLength(3);
    const sum = r.top.reduce((s, x) => s + x.confidence, 0);
    expect(sum).toBeLessThanOrEqual(1.0001);
  });

  it("ranks chickpea first for a dry rabi profile", () => {
    expect(
      recommendLocal({ N: 40, P: 65, K: 78, temperature: 19, humidity: 18, ph: 7.2, rainfall: 80 }).top[0].crop,
    ).toBe("chickpea");
  });
});

describe("fertilizer", () => {
  it("uses DAP for P, then urea for remaining N, and MOP for K", () => {
    const r = fertilizerLocal({ crop: "rice", N: 20, P: 20, K: 10, area_ha: 2 });
    const dap = r.doses.find((d) => d.product.startsWith("DAP"));
    const urea = r.doses.find((d) => d.product.startsWith("Urea"));
    const mop = r.doses.find((d) => d.product.startsWith("MOP"));
    expect(dap.kg_per_ha).toBeCloseTo(28 / 0.46, 0); // P target 48
    expect(urea.kg_per_ha).toBeCloseTo((60 - (28 / 0.46) * 0.18) / 0.46, 0); // N target 80
    expect(mop.kg_per_ha).toBeCloseTo(30 / 0.6, 0); // K target 40
    expect(dap.total_kg).toBeCloseTo(dap.kg_per_ha * 2, 0);
  });

  it("recommends nothing when soil meets the target", () => {
    expect(fertilizerLocal({ crop: "maize", N: 78, P: 48, K: 20 }).doses).toHaveLength(0);
  });
});

describe("soil health", () => {
  it("scores a balanced soil higher than a depleted, saline one", () => {
    const good = soilHealth({ N: 420, P: 20, K: 220, oc: 0.8, ph: 7, ec: 0.4 });
    const bad = soilHealth({ N: 120, P: 4, K: 60, oc: 0.2, ph: 9.2, ec: 4 });
    expect(good.score).toBeGreaterThan(80);
    expect(bad.score).toBeLessThan(45);
    expect(bad.issues.map((i) => i.key)).toEqual(expect.arrayContaining(["N", "P", "K", "oc", "ph", "ec"]));
    expect(good.issues).toHaveLength(0);
  });
});

describe("irrigation (FAO-56)", () => {
  it("converts mm over hectares to cubic metres and credits effective rain", () => {
    const plan = irrigationPlan({
      crop: "Wheat",
      stage: "Mid-season",
      method: "Drip",
      areaHa: 1,
      et0: [5, 5],
      rain: [0, 10],
    });
    expect(plan.kc).toBe(1.15);
    expect(plan.etcTotal).toBeCloseTo(11.5, 1);
    expect(plan.effectiveRain).toBe(8); // 80% of 10 mm
    expect(plan.netMm).toBeCloseTo(3.5, 1);
    expect(plan.volumeM3).toBe(Math.round((3.5 / 0.9) * 10));
    const flood = plan.byMethod.find((m) => m.method === "Flood").m3;
    expect(flood).toBeGreaterThan(plan.byMethod.find((m) => m.method === "Drip").m3);
  });
});

describe("leaf image screening", () => {
  it("classifies colour classes", () => {
    expect(analyzeLeafPixels(pixels([40, 150, 50])).pct.healthy).toBe(100);
    expect(analyzeLeafPixels(pixels([220, 200, 40])).pct.yellow).toBe(100);
    expect(analyzeLeafPixels(pixels([120, 60, 20])).pct.brown).toBe(100);
    expect(analyzeLeafPixels(pixels([245, 245, 245])).pct.white).toBe(100);
  });

  it("ignores blue background and lowers the health index for lesions", () => {
    expect(analyzeLeafPixels(pixels([40, 90, 220])).plantPixels).toBe(0);
    const healthy = analyzeLeafPixels(pixels([40, 150, 50])).healthIndex;
    const sick = analyzeLeafPixels(
      new Uint8ClampedArray([...pixels([40, 150, 50], 200), ...pixels([120, 60, 20], 200)]),
    ).healthIndex;
    expect(healthy).toBe(100);
    expect(sick).toBeLessThan(40);
  });
});
