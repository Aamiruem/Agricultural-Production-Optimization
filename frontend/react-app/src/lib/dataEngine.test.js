import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  applyFilters,
  buildDataset,
  correlationMatrix,
  countDuplicates,
  detectRoles,
  generateInsights,
  groupBy,
  histogram,
  parseText,
  pearson,
  profileColumns,
  timeSeries,
  toNumber,
  trendOf,
} from "./dataEngine";

// Tests run from the react-app root (vitest cwd).
const sample = (name) => readFileSync(join(process.cwd(), "public", "samples", name), "utf8");
const load = (text) => {
  const { columns, rows } = parseText(text);
  const profiles = profileColumns(columns, rows);
  const roles = detectRoles(profiles);
  return { columns, rows, profiles, roles, ds: buildDataset(rows, profiles, roles) };
};

describe("parsing & typing", () => {
  it("reads Indian number formats and nulls", () => {
    expect(toNumber("1,23,456.5")).toBe(123456.5);
    expect(toNumber("₹1,200")).toBe(1200);
    expect(toNumber("45%")).toBe(45);
    expect(toNumber("NA")).toBeNull();
    expect(toNumber("abc")).toBeNull();
  });

  it("handles quotes, semicolons, BOM and duplicate headers", () => {
    const { columns, rows } = parseText('\uFEFFCrop;Area;Area\n"Rice, basmati";1,5;2\nWheat;3;4\n');
    expect(columns).toEqual(["Crop", "Area", "Area (2)"]);
    expect(rows[0].Crop).toBe("Rice, basmati");
  });

  it("detects year, date, numeric and category columns", () => {
    const p = profileColumns(
      ["Year", "Day", "Rain", "Crop"],
      parseText("Year,Day,Rain,Crop\n2019,2019-06-01,12,Rice\n2020,2019-06-02,0,Wheat\n2021,2019-06-03,5.5,Rice\n")
        .rows,
    );
    expect(p.map((x) => x.type)).toEqual(["year", "date", "numeric", "category"]);
  });
});

describe("crop-yield sample (state records)", () => {
  const { ds, profiles, roles } = load(sample("india-crop-yield-sample.csv"));

  it("maps agricultural roles", () => {
    expect(roles).toMatchObject({
      crop: "Crop",
      state: "State",
      season: "Season",
      year: "Crop_Year",
      area: "Area",
      production: "Production",
      yield: "Yield",
      rainfall: "Annual_Rainfall",
      fertilizer: "Fertilizer",
      pesticide: "Pesticide",
    });
    expect(ds.records.length).toBeGreaterThan(3000);
  });

  it("aggregates production as a sum and yield area-weighted", () => {
    const byCrop = groupBy(ds.records, roles.crop, roles.production, ds.roles);
    expect(byCrop.mode).toBe("sum");
    const wheat = groupBy(
      ds.records.filter((r) => r.Crop === "Wheat"),
      roles.state,
      roles.yield,
      ds.roles,
    );
    expect(wheat.mode).toBe("weighted");
    const punjab = wheat.data.find((d) => d.key === "Punjab");
    if (punjab) expect(punjab.value).toBeGreaterThan(3.5); // Punjab wheat ≈ 4.5 t/ha
  });

  it("builds a yearly series, filters and writes insights", () => {
    const ts = timeSeries(ds.records, roles.production, ds.roles);
    expect(ts.unit).toBe("year");
    expect(ts.data[0].key).toBeLessThan(ts.data.at(-1).key);
    const f = applyFilters(ds.records, { categories: { State: "Punjab" }, yearRange: [2010, 2015] }, ds.roles);
    expect(f.every((r) => r.State === "Punjab" && r.Crop_Year >= 2010 && r.Crop_Year <= 2015)).toBe(true);
    const ins = generateInsights(ds, ds.records, profiles, roles.production);
    expect(ins.some((i) => i.kind === "top")).toBe(true);
    expect(ins.some((i) => i.kind === "geo")).toBe(true);
  });
});

describe("soil-nutrient sample (crop recommendation data)", () => {
  const { ds, roles, profiles } = load(sample("soil-nutrients-crop.csv"));
  it("finds N-P-K, climate and the crop label", () => {
    expect(roles).toMatchObject({
      nitrogen: "N",
      phosphorus: "P",
      potassium: "K",
      temperature: "temperature",
      humidity: "humidity",
      ph: "ph",
      rainfall: "rainfall",
      crop: "label",
    });
    const ins = generateInsights(ds, ds.records, profiles, roles.rainfall);
    expect(ins.some((i) => i.kind === "soil")).toBe(true);
  });
  it("computes a symmetric correlation matrix", () => {
    const cols = ["N", "P", "K"];
    const m = correlationMatrix(ds.records, cols);
    expect(m[0][0]).toBe(1);
    expect(m[1][2]).toBeCloseTo(m[2][1], 10);
    expect(m[1][2]).toBeGreaterThan(0.5); // P and K are strongly linked in this dataset
  });
});

describe("daily-weather sample", () => {
  const { ds, roles, profiles } = load(sample("ludhiana-daily-weather.csv"));
  it("uses the date column and aggregates by month", () => {
    expect(roles.date).toBe("date");
    expect(roles.rainfall).toBe("precipitation_sum");
    const ts = timeSeries(ds.records, roles.rainfall, ds.roles);
    expect(ts.unit).toBe("month");
    expect(ts.data.length).toBeGreaterThanOrEqual(100);
    expect(generateInsights(ds, ds.records, profiles, roles.rainfall).some((i) => i.kind === "weather")).toBe(true);
  });
});

describe("derived yield, stats and quality", () => {
  it("derives yield from production ÷ area when missing", () => {
    const { ds } = load("District,Crop,Area_ha,Production_t\nA,Rice,2,8\nB,Rice,1,3\nC,Wheat,4,12\n");
    expect(ds.derived).toEqual(["yield"]);
    expect(ds.records[0]["Yield (derived)"]).toBe(4);
    const rice = groupBy(
      ds.records.filter((r) => r.Crop === "Rice"),
      "Crop",
      ds.roles.yield,
      ds.roles,
    ).data[0];
    expect(rice.value).toBeCloseTo(11 / 3, 5); // area-weighted, not the mean of 4 and 3
  });

  it("computes pearson, histogram and duplicates", () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1);
    expect(pearson([1, 2], [1, 2])).toBeNull();
    const h = histogram(Array.from({ length: 100 }, (_, i) => i));
    expect(h.reduce((s, b) => s + b.count, 0)).toBe(100);
    expect(countDuplicates([{ a: 1 }, { a: 1 }, { a: 2 }], ["a"])).toBe(1);
  });
});

describe("trend method", () => {
  const series = (unit, values, start = 2010) => ({
    unit,
    mode: "sum",
    data: values.map((v, i) => ({
      key: unit === "year" ? start + i : `${start + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`,
      value: v,
      count: 1,
    })),
  });

  it("fits a steady growth rate across all years, not just the endpoints", () => {
    const t = trendOf(series("year", [100, 110, 121, 133.1, 146.41]));
    expect(t.kind).toBe("trend");
    expect(t.pct).toBeCloseTo(0.1, 3);
    expect(t.r2).toBeCloseTo(1, 5);
  });

  it("is not fooled by a noisy last year", () => {
    const t = trendOf(series("year", [100, 102, 104, 106, 108, 20]));
    expect(t.pct).toBeGreaterThan(-0.3); // endpoint CAGR would be about −28%/yr
    expect(t.r2).toBeLessThan(0.6);
  });

  it("rolls monthly data up to years before fitting", () => {
    const monthly = Array.from({ length: 36 }, (_, i) => 10 * 1.05 ** Math.floor(i / 12));
    const t = trendOf(series("month", monthly, 2020));
    expect(t.first.key).toBe(2020);
    expect(t.pct).toBeCloseTo(0.05, 3);
  });

  it("reports plain change for short periods instead of annualising", () => {
    const t = trendOf(series("month", [100, 150, 200]));
    expect(t.kind).toBe("change");
    expect(t.change).toBeCloseTo(1, 5);
  });

  it("flags uneven row coverage for summed metrics", () => {
    const s2 = series("year", [10, 20, 30]);
    s2.data[0].count = 1;
    s2.data[1].count = 5;
    s2.data[2].count = 2;
    expect(trendOf(s2).uneven).toBe(true);
  });
});
