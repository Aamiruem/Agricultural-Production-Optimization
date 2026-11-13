import { describe, expect, it } from "@jest/globals";
import { AxiosError, AxiosHeaders } from "axios";

import { getErrorMessage } from "@/lib/api/client";
import { CROP_NAMES, formatCropName, formatPercent, seasonLabel } from "@/lib/crops";

describe("crop formatting", () => {
  it("formats crop names for display", () => {
    expect(formatCropName("rice")).toBe("Rice");
    expect(formatCropName("kidneybeans")).toBe("Kidney beans");
    expect(formatCropName(" BlackGram ")).toBe("Black gram");
  });

  it("formats and clamps percentages", () => {
    expect(formatPercent(0.4567)).toBe("46%");
    expect(formatPercent(0.4567, 1)).toBe("45.7%");
    expect(formatPercent(1.4)).toBe("100%");
    expect(formatPercent(-0.2)).toBe("0%");
  });

  it("labels seasons", () => {
    expect(seasonLabel("rabi")).toBe("Rabi");
    expect(seasonLabel("winter")).toBe("Unknown");
  });

  it("lists all 22 crops served by the API", () => {
    expect(CROP_NAMES).toHaveLength(22);
    expect(new Set(CROP_NAMES).size).toBe(22);
  });
});

describe("getErrorMessage", () => {
  const config = { headers: new AxiosHeaders() };
  const httpError = (status: number, data: unknown) =>
    new AxiosError("fail", "ERR", config, null, {
      status, data, statusText: "", headers: {}, config,
    });

  it("explains network failures", () => {
    expect(getErrorMessage(new AxiosError("Network Error"))).toMatch(/Cannot reach the API/);
  });

  it("uses FastAPI's string detail", () => {
    expect(getErrorMessage(httpError(404, { detail: "Unknown crop 'xyz'" }))).toBe("Unknown crop 'xyz'");
  });

  it("uses the first validation message from a 422", () => {
    const err = httpError(422, { detail: [{ msg: "Input should be less than or equal to 14" }] });
    expect(getErrorMessage(err)).toBe("Input should be less than or equal to 14");
  });

  it("falls back to the status code or plain error message", () => {
    expect(getErrorMessage(httpError(500, {}))).toBe("Request failed with status 500");
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("??")).toBe("Something went wrong");
  });
});
