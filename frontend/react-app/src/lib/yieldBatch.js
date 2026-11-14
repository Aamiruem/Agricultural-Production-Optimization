// CSV batch scoring for the yield predictor (runs in the browser).
import { predictYieldLocal } from "./agriModels";

/** Parse a simple CSV (no quoted commas needed for these columns). */
export function parseCsv(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
  const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
  for (const col of ["crop", "state", "season", "year", "area_ha"])
    if (!head.includes(col)) throw new Error(`Missing column: ${col}`);
  return lines.slice(1, 501).map((line) => Object.fromEntries(line.split(",").map((v, i) => [head[i], v.trim()])));
}

export function scoreRows(rows) {
  return rows.map((r) => {
    try {
      const p = predictYieldLocal({
        crop: r.crop,
        state: r.state,
        season: r.season,
        year: Number(r.year),
        area_ha: Number(r.area_ha),
        annual_rainfall: r.annual_rainfall ? Number(r.annual_rainfall) : undefined,
      });
      return {
        ...r,
        yield_t_ha: p.yield_t_ha,
        production_t: p.production_t,
        note: p.exact_match ? "" : "no exact state/season history",
      };
    } catch (e) {
      return { ...r, yield_t_ha: "", production_t: "", note: e.message };
    }
  });
}
