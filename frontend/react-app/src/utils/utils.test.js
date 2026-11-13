import { describe, expect, it } from "vitest";

import { CROP_NAMES, formatCropName, seasonLabel } from "./crops";
import { formatPercent, safeRedirect } from "./format";
import { registerSchema, soilSchema } from "./validation";

describe("formatting", () => {
  it("formats crop names and seasons", () => {
    expect(formatCropName("kidneybeans")).toBe("Kidney beans");
    expect(formatCropName(" Rice ")).toBe("Rice");
    expect(seasonLabel("rabi")).toBe("Rabi");
    expect(seasonLabel("winter")).toBe("Unknown");
    expect(CROP_NAMES).toHaveLength(22);
  });

  it("formats and clamps percentages", () => {
    expect(formatPercent(0.4567)).toBe("46%");
    expect(formatPercent(0.4567, 1)).toBe("45.7%");
    expect(formatPercent(3)).toBe("100%");
    expect(formatPercent(-1)).toBe("0%");
  });

  it("only allows same-site redirects after login", () => {
    expect(safeRedirect("/insights")).toBe("/insights");
    expect(safeRedirect("//evil.example")).toBe("/farms");
    expect(safeRedirect("https://evil.example")).toBe("/farms");
    expect(safeRedirect(null)).toBe("/farms");
  });
});

describe("validation (Zod)", () => {
  const soil = { N: 80, P: 45, K: 40, temperature: 24, humidity: 80, ph: 6.5, rainfall: 220 };

  it("accepts realistic soil readings and rejects out-of-range ones", () => {
    expect(soilSchema.safeParse(soil).success).toBe(true);
    expect(soilSchema.safeParse({ ...soil, ph: 15 }).error.issues[0].message).toBe("pH must be at most 14");
    expect(soilSchema.safeParse({ ...soil, K: Number.NaN }).error.issues[0].message).toBe("Potassium is required");
  });

  it("requires strong-enough passwords", () => {
    const base = { full_name: "Ravi", email: "ravi@example.com" };
    expect(registerSchema.safeParse({ ...base, password: "green123" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: "abcdefgh" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "x1" }).success).toBe(false);
  });
});
