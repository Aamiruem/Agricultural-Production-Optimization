import { describe, expect, it } from "@jest/globals";

import { fertilizerSchema, fieldSchema, soilSchema } from "@/lib/validation";

const validSoil = { N: 80, P: 45, K: 40, temperature: 24, humidity: 80, ph: 6.5, rainfall: 220 };

describe("soilSchema", () => {
  it("accepts realistic readings", () => {
    expect(soilSchema.safeParse(validSoil).success).toBe(true);
  });

  it.each([
    ["N", -1, "Nitrogen must be at least 0"],
    ["ph", 14.5, "pH must be at most 14"],
    ["humidity", 101, "Humidity must be at most 100"],
    ["rainfall", 900, "Rainfall must be at most 500"],
  ])("rejects %s = %p", (key, value, message) => {
    const result = soilSchema.safeParse({ ...validSoil, [key]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });

  it("reports NaN (an empty number input) as required", () => {
    const result = soilSchema.safeParse({ ...validSoil, K: Number.NaN });
    expect(result.error?.issues[0].message).toBe("Potassium is required");
  });
});

describe("fertilizerSchema", () => {
  it("requires a crop and a positive area", () => {
    const result = fertilizerSchema.safeParse({ crop: "", N: 1, P: 1, K: 1, area_ha: 0 });
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toEqual(["Choose a crop", "Area must be at least 0.1"]);
  });
});

describe("fieldSchema", () => {
  it("trims names and validates season", () => {
    const ok = fieldSchema.parse({ name: "  North plot ", crop: "rice", areaHa: 2, season: "rabi" });
    expect(ok.name).toBe("North plot");
    expect(fieldSchema.safeParse({ ...ok, season: "monsoon" }).success).toBe(false);
  });
});
