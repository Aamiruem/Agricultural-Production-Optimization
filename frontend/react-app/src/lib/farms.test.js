import { beforeEach, describe, expect, it } from "vitest";

import { DISTRICTS, DISTRICT_COUNT, districtsFor } from "@/data/districts";
import { STATES } from "@/data/indiaAgri";

import { currentSeason, farmCoords, nearestState, recommendedFieldCrops } from "./farmIntel";
import { localFarms } from "./localFarms";

describe("districts", () => {
  it("lists districts for every state and UT", () => {
    for (const s of STATES) expect(districtsFor(s.name).length, s.name).toBeGreaterThan(0);
    expect(Object.keys(DISTRICTS).sort()).toEqual(STATES.map((s) => s.name).sort());
  });

  it("has the expected counts for large states", () => {
    expect(districtsFor("Uttar Pradesh")).toHaveLength(75);
    expect(districtsFor("Bihar")).toHaveLength(38);
    expect(districtsFor("Tamil Nadu")).toHaveLength(38);
    expect(districtsFor("Telangana")).toHaveLength(33);
    expect(districtsFor("Kerala")).toHaveLength(14);
    expect(DISTRICT_COUNT).toBeGreaterThan(750);
  });

  it("has no duplicates within a state", () => {
    for (const [state, list] of Object.entries(DISTRICTS)) expect(new Set(list).size, state).toBe(list.length);
  });
});

describe("farm intelligence", () => {
  it("maps months to Indian cropping seasons", () => {
    expect(currentSeason(6)).toBe("kharif"); // July
    expect(currentSeason(10)).toBe("rabi"); // November
    expect(currentSeason(0)).toBe("rabi"); // January
    expect(currentSeason(3)).toBe("zaid"); // April
  });

  it("suggests local, in-season crops first", () => {
    const punjabKharif = recommendedFieldCrops("Punjab", "kharif").map((c) => c.crop);
    expect(punjabKharif.slice(0, 3)).toEqual(expect.arrayContaining(["rice"]));
    expect(punjabKharif).toContain("cotton");
    const mpRabi = recommendedFieldCrops("Madhya Pradesh", "rabi").map((c) => c.crop);
    expect(mpRabi[0]).toBe("chickpea");
    expect(mpRabi).not.toContain("coffee");
    // Rice is kharif-only in Punjab (boro rice is a West Bengal rabi crop).
    expect(recommendedFieldCrops("Punjab", "rabi").map((c) => c.crop)).not.toContain("rice");
    expect(recommendedFieldCrops("West Bengal", "rabi").map((c) => c.crop)).toContain("rice");
  });

  it("guesses the state from GPS and prefers a farm's own coordinates for weather", () => {
    expect(nearestState(12.97, 77.6)).toBe("Karnataka"); // Bengaluru
    expect(nearestState(26.9, 75.8)).toBe("Rajasthan"); // Jaipur
    expect(farmCoords({ state: "Kerala" })).toMatchObject({ precise: false });
    expect(farmCoords({ state: "Kerala", point: { coordinates: [76.2, 10.5] } })).toMatchObject({ lat: 10.5, lon: 76.2, precise: true });
  });
});

describe("on-device farm store", () => {
  beforeEach(() => localFarms.clear());

  it("creates farms with location and rejects duplicate names", () => {
    const farm = localFarms.createFarm({ name: "Green Acres", location: { state: "Punjab", district: "Ludhiana", lat: 30.9, lng: 75.85 } });
    expect(farm.location).toMatchObject({ state: "Punjab", district: "Ludhiana", point: { coordinates: [75.85, 30.9] } });
    expect(() => localFarms.createFarm({ name: "green acres" })).toThrow(/already/);
    expect(localFarms.listFarms()).toHaveLength(1);
  });

  it("tracks fields, totals, activities and status like the server", () => {
    const farm = localFarms.createFarm({ name: "Plot A", location: { state: "Bihar" } });
    const f1 = localFarms.createField(farm._id, { name: "North", crop: "Rice", season: "kharif", areaHa: 2, soil: { N: 30, P: 20, K: 20 } });
    localFarms.createField(farm._id, { name: "South", crop: "maize", season: "kharif", areaHa: 1.5 });
    expect(f1.crop).toBe("rice");
    localFarms.logActivity(f1._id, { type: "sowing", notes: "IR-64" });
    const sum = localFarms.summary(farm._id);
    expect(sum.totals).toEqual({ fields: 2, areaHa: 3.5 });
    expect(sum.byStatus).toEqual({ sown: 1, planned: 1 });
    expect(sum.byCrop[0]).toMatchObject({ crop: "rice", areaHa: 2 });
    expect(sum.recentActivities[0]).toMatchObject({ type: "sowing", fieldName: "North" });
    expect(localFarms.listFarms()[0]).toMatchObject({ fields: 2, areaHa: 3.5 });
  });

  it("computes a fertilizer plan from field soil and cascades deletes", () => {
    const farm = localFarms.createFarm({ name: "Plot B" });
    const field = localFarms.createField(farm._id, { name: "East", crop: "rice", season: "kharif", areaHa: 2, soil: { N: 20, P: 20, K: 10 } });
    const plan = localFarms.fertilizerPlan(field._id);
    expect(plan.area_ha).toBe(2);
    expect(plan.doses.length).toBe(3);
    const bare = localFarms.createField(farm._id, { name: "West", crop: "rice", season: "kharif", areaHa: 1 });
    expect(() => localFarms.fertilizerPlan(bare._id)).toThrow(/soil/i);
    localFarms.deleteFarm(farm._id);
    expect(localFarms.listFarms()).toHaveLength(0);
    expect(() => localFarms.listFields(farm._id)).toThrow(/not found/i);
  });
});
