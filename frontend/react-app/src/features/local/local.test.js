import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { classifyConditions, cropSeason, rainfallCategory, summarizeHistory } from "./climate";
import { canonicalRows, detectSchema, parseCsv, recordsFor, stateAgriculture } from "./dataset";
import { convertArea, featureAt, haversineKm, ringAreaM2 } from "./geo";
import { compareProfiles, numericSimilarity, validateDataset } from "./matching";
import { availableWaterMmPerM, parseSoilgrids, soilgridsLayer, usdaTexture } from "./soil";
import { historicalYield, scoreCrops } from "./suitability";

const ROOT = path.resolve(__dirname, "../../../../..");

describe("geo", () => {
  it("measures a 1 km × 1 km square near the equator as ~100 ha (geodesic, not pixels)", () => {
    const d = 1 / 111.32;
    const ring = [
      [0, 0],
      [0, d],
      [d, d],
      [d, 0],
    ];
    expect(ringAreaM2(ring) / 1e4).toBeGreaterThan(99);
    expect(ringAreaM2(ring) / 1e4).toBeLessThan(101);
  });

  it("shrinks east-west distance with latitude", () => {
    const at = (lat) =>
      ringAreaM2([
        [lat, 0],
        [lat, 0.01],
        [lat + 0.01, 0.01],
        [lat + 0.01, 0],
      ]);
    expect(at(60) / at(0)).toBeCloseTo(Math.cos((60 * Math.PI) / 180), 2);
  });

  it("computes haversine distance", () => {
    expect(haversineKm([28.6139, 77.209], [19.076, 72.8777])).toBeGreaterThan(1140);
    expect(haversineKm([28.6139, 77.209], [19.076, 72.8777])).toBeLessThan(1160);
  });

  it("converts area units and explains the factor", () => {
    expect(convertArea(1, "acre", "ha").value).toBeCloseTo(0.404686, 5);
    expect(convertArea(1, "ha", "acre").value).toBeCloseTo(2.471054, 5);
    const b = convertArea(10, "bigha-wb", "ha");
    expect(b.value).toBeCloseTo(1.3378, 4);
    expect(b.explanation).toMatch(/Bigha/);
    expect(() => convertArea(1, "furlong")).toThrow();
  });

  it("finds the polygon containing a point (holes respected)", () => {
    const fc = {
      features: [
        {
          properties: { name: "donut" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
              ],
              [
                [4, 4],
                [6, 4],
                [6, 6],
                [4, 6],
                [4, 4],
              ],
            ],
          },
        },
      ],
    };
    expect(featureAt([2, 2], fc)?.properties.name).toBe("donut");
    expect(featureAt([5, 5], fc)).toBeNull(); // in the hole
    expect(featureAt([20, 20], fc)).toBeNull();
  });
});

describe("climate", () => {
  it("maps months to Indian crop seasons", () => {
    expect(cropSeason(7).id).toBe("Kharif");
    expect(cropSeason(12).id).toBe("Rabi");
    expect(cropSeason(4).id).toBe("Zaid");
  });

  it("uses IMD rainfall departure categories", () => {
    expect(rainfallCategory(65)).toBe("Large excess");
    expect(rainfallCategory(25)).toBe("Excess");
    expect(rainfallCategory(-10)).toBe("Normal");
    expect(rainfallCategory(-35)).toBe("Deficient");
    expect(rainfallCategory(-70)).toBe("Large deficient");
  });

  it("summarises daily history into normals, trend and departure", () => {
    const time = [];
    const p = [];
    for (let y = 2016; y <= 2026; y++) {
      for (let d = new Date(Date.UTC(y, 0, 1)); d.getUTCFullYear() === y; d = new Date(d.getTime() + 864e5)) {
        const iso = d.toISOString().slice(0, 10);
        if (y === 2026 && iso > "2026-08-31") break;
        time.push(iso);
        const m = d.getUTCMonth() + 1;
        p.push(m >= 6 && m <= 9 ? (y === 2026 ? 2 : 5) : 0.5);
      }
    }
    const h = summarizeHistory(
      { time, precipitation_sum: p, temperature_2m_mean: p.map(() => 25), relative_humidity_2m_mean: p.map(() => 60) },
      new Date("2026-09-10"),
    );
    expect(h.years).toHaveLength(10);
    expect(h.monthly[6].rain).toBeCloseTo(155, 0); // July: 31 × 5 mm
    expect(h.departure.category).toBe("Large deficient"); // 2 vs 5 mm/day = -60%: IMD "large deficient" is -60% to -99%
    expect(h.departure.pct).toBeLessThan(-20);
  });

  it("flags heat, waterlogging and water stress from the forecast", () => {
    const flags = classifyConditions({
      current: { relative_humidity_2m: 80 },
      daily: {
        temperature_2m_max: [41, 39],
        temperature_2m_min: [28, 27],
        precipitation_sum: [70, 0],
        et0_fao_evapotranspiration: [6, 6],
      },
    }).flags.map((f) => f.id);
    expect(flags).toEqual(expect.arrayContaining(["heat", "humid", "waterlogging"]));
  });
});

describe("soil", () => {
  it("classifies USDA textures", () => {
    expect(usdaTexture(90, 5, 5)).toBe("Sand");
    expect(usdaTexture(40, 40, 20)).toBe("Loam");
    expect(usdaTexture(20, 60, 20)).toBe("Silt loam");
    expect(usdaTexture(20, 20, 60)).toBe("Clay");
    expect(usdaTexture(50, 13, 37)).toBe("Sandy clay");
    expect(usdaTexture(35, 32, 33)).toBe("Clay loam");
  });

  it("estimates more available water in loam than sand", () => {
    expect(availableWaterMmPerM(40, 20, 2.5)).toBeGreaterThan(availableWaterMmPerM(90, 5, 0.5));
  });

  it("parses SoilGrids units and flags masked cells as missing (no guesses)", () => {
    const layer = (name, d, values) => ({
      name,
      unit_measure: { d_factor: d },
      depths: ["0-5cm", "5-15cm", "15-30cm"].map((label, i) => ({ label, values: { mean: values[i] } })),
    });
    const json = {
      properties: {
        layers: [
          layer("phh2o", 10, [78, 79, 78]),
          layer("clay", 10, [247, 246, 287]),
          layer("sand", 10, [387, 388, 360]),
          layer("silt", 10, [366, 366, 353]),
          layer("soc", 10, [130, 88, 80]),
          layer("nitrogen", 100, [103, 76, 64]),
        ],
      },
    };
    expect(soilgridsLayer(json, "phh2o")).toBeCloseTo(7.83, 2);
    const s = parseSoilgrids(json);
    expect(s.ph.value).toBe(7.8);
    expect(s.ph.type).toBe("modelled");
    expect(s.texture.value).toBe("Loam");
    expect(s.cec.missing).toBe(true); // layer absent -> missing, not invented
  });
});

describe("dataset schema detection", () => {
  it("maps crop_yield.csv columns to canonical fields", () => {
    const text = readFileSync(path.join(ROOT, "frontend/react-app/public/data/crop_yield.csv"), "utf8");
    const { headers, rows } = parseCsv(text);
    const s = detectSchema(headers, rows);
    expect(s.mapping).toMatchObject({
      crop: "Crop",
      year: "Crop_Year",
      season: "Season",
      state: "State",
      area: "Area",
      production: "Production",
      rainfall: "Annual_Rainfall",
      fertilizer: "Fertilizer",
      pesticide: "Pesticide",
      yield: "Yield",
    });
    expect(s.hasLocation).toBe(true);
    expect(s.hasCoordinates).toBe(false);
    const canon = canonicalRows(rows, s.mapping);
    const { inState, level } = recordsFor(canon, { state: "Punjab" });
    expect(level).toBe("state");
    expect(inState.length).toBeGreaterThan(100);
    const agri = stateAgriculture(inState);
    expect(agri.latestYear).toBe(2019); // the dataset has no 2020 rows for Punjab
    expect(agri.crops.map((c) => c.crop)).toEqual(expect.arrayContaining(["Wheat", "Rice"]));
  });

  it("detects crop_data.csv as profiles without location", () => {
    const text = readFileSync(path.join(ROOT, "frontend/react-app/public/data/crop_data.csv"), "utf8");
    const { headers, rows } = parseCsv(text);
    const s = detectSchema(headers, rows);
    expect(s.mapping).toMatchObject({
      N: "N",
      P: "P",
      K: "K",
      temperature: "temperature",
      humidity: "humidity",
      ph: "ph",
      rainfall: "rainfall",
      crop: "label",
    });
    expect(s.hasLocation).toBe(false);
  });

  it("detects coordinates and messy headers in an uploaded file", () => {
    const { headers, rows } = parseCsv(
      "Village Name,Latitude,Longitude,Soil pH,Crop Type\nRampur,26.1,80.2,7.1,Wheat\nSitapur,27.5,80.6,6.8,Rice",
    );
    const s = detectSchema(headers, rows);
    expect(s.mapping).toMatchObject({
      village: "Village Name",
      lat: "Latitude",
      lon: "Longitude",
      ph: "Soil pH",
      crop: "Crop Type",
    });
    expect(s.hasCoordinates).toBe(true);
  });

  it("keeps the static copies identical to the AIML datasets", () => {
    for (const f of ["crop_yield.csv", "crop_data.csv"]) {
      expect(readFileSync(path.join(ROOT, "frontend/react-app/public/data", f), "utf8")).toBe(
        readFileSync(path.join(ROOT, "AIML/datasets", f), "utf8"),
      );
    }
  });
});

describe("matching (shared hand-computed cases)", () => {
  const { cases } = JSON.parse(readFileSync(path.join(ROOT, "shared/local-intel/matching_cases.json"), "utf8"));
  for (const c of cases) {
    it(c.name, () => {
      const res = compareProfiles(c.profile, c.local, { now: new Date(c.now) });
      expect(res.score).toBeCloseTo(c.expected.score, 1);
      expect(res.coverage).toBeCloseTo(c.expected.coverage, 1);
      for (const [k, st] of Object.entries(c.expected.status))
        expect(res.rows.find((r) => r.key === k).status, k).toBe(st);
      for (const [k, sim] of Object.entries(c.expected.similarity))
        expect(res.rows.find((r) => r.key === k).similarity, k).toBeCloseTo(sim, 2);
      expect(res.confidence.temporal.level).toBe(c.expected.temporal);
      expect(res.disclaimer).toMatch(/not the accuracy/);
    });
  }

  it("never counts missing values as matches", () => {
    const res = compareProfiles({ state: "Goa", crops: [], seasons: [] }, { state: "Goa", crops: [], levels: {} });
    expect(res.score).toBe(60); // only location is comparable
    expect(res.missing.length).toBeGreaterThan(8);
  });

  it("numeric similarity is tolerance based", () => {
    expect(numericSimilarity(7, 7.5, { abs: 1 })).toBe(0.5);
    expect(numericSimilarity(100, 200, { rel: 0.25 })).toBe(0);
    expect(numericSimilarity(null, 1, { abs: 1 })).toBeNull();
  });
});

describe("data quality", () => {
  it("finds duplicates, conflicts, invalid values and inconsistent yields", () => {
    const rows = [
      { state: "Punjab", crop: "Wheat", season: "Rabi", year: 2020, area: 100, production: 500, yield: 5, ph: 7 },
      { state: "Punjab", crop: "Wheat", season: "Rabi", year: 2020, area: 100, production: 500, yield: 5, ph: 7 },
      { state: "Punjab", crop: "Wheat", season: "Rabi", year: 2020, area: 100, production: 900, yield: 5, ph: 14 },
      {
        state: "Punjab",
        crop: "Rice",
        season: "Kharif",
        year: 2020,
        area: 100,
        production: null,
        yield: null,
        ph: null,
      },
    ];
    const q = validateDataset(rows, { now: new Date("2026-11-14") });
    expect(q.duplicates).toBe(1);
    expect(q.conflicts).toBe(3);
    expect(q.invalid).toBe(1);
    expect(q.inconsistent).toBe(1);
    expect(q.score).toBeLessThan(90);
    expect(q.issues.join(" ")).toMatch(/duplicate/);
  });
});

describe("crop suitability", () => {
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    temp: [14, 17, 23, 29, 33, 33, 31, 30, 29, 26, 20, 15][i],
    rain: [20, 25, 20, 10, 15, 70, 200, 180, 90, 10, 5, 10][i],
  }));
  const ctx = {
    state: "Punjab",
    season: "Rabi",
    monthlyNormals: monthly,
    annualRain: 655,
    irrigation: true,
    soilClasses: ["Alluvial"],
    texture: "Loam",
    ph: 7.8,
    npk: null,
    humidity: 60,
    stateCrops: ["Wheat", "Rice", "Rapeseed &Mustard", "Gram", "Barley"],
    conditions: [],
  };

  it("ranks Rabi crops in Punjab and excludes out-of-season ones", () => {
    const r = scoreCrops(ctx);
    const top = r.top.map((t) => t.crop);
    expect(top).toEqual(expect.arrayContaining(["Wheat"]));
    expect(r.ranked.every((c) => c.inSeason)).toBe(true);
    expect(r.avoid.some((a) => a.crop === "Cotton")).toBe(true); // Kharif crop
    expect(r.mlUsed).toBe(false); // no soil-test NPK -> no ML
    expect(r.top[0].reasons.length).toBeGreaterThan(0);
  });

  it("uses the ML model only with soil-test N, P, K", () => {
    const r = scoreCrops({ ...ctx, season: "Kharif", npk: { N: 90, P: 42, K: 43 } });
    expect(r.mlUsed).toBe(true);
  });

  it("penalises acid-soil crops on alkaline soil", () => {
    const r = scoreCrops({ ...ctx, season: "Kharif" });
    const tea = r.ranked.find((c) => c.crop === "Tea");
    const maize = r.ranked.find((c) => c.crop === "Maize");
    expect(tea.parts.ph).toBeLessThan(maize.parts.ph);
  });

  it("reads historical yield quartiles from the dataset model", () => {
    const h = historicalYield("Punjab", "Wheat", "Rabi");
    expect(h.crop).toBe("Wheat");
    expect(h.n).toBeGreaterThan(5);
    expect(h.p25).toBeLessThan(h.p75);
  });
});
