import { useState } from "react";

import { MIcon } from "@/components/common/MIcon";
import { parseCsv, scoreRows } from "@/lib/yieldBatch";

const TEMPLATE = "crop,state,season,year,area_ha,annual_rainfall\nWheat,Punjab,Rabi,2025,2,\nRice,West Bengal,Kharif,2025,1.5,1600\nCotton(lint),Maharashtra,Kharif,2025,3,800\n";

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

/** Score many fields at once from a CSV file, fully in the browser. */
export function YieldBatch() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const onFile = async (file) => {
    setError(""); setResult(null);
    if (!file) return;
    try { setResult(scoreRows(parseCsv(await file.text()))); } catch (e) { setError(e.message); }
  };
  const toCsv = (rows) => {
    const cols = ["crop", "state", "season", "year", "area_ha", "annual_rainfall", "yield_t_ha", "production_t", "note"];
    return [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  };
  const ok = result?.filter((r) => r.yield_t_ha !== "") ?? [];

  return (
    <section className="tool-card">
      <div className="card-head">
        <div><h2>Batch prediction (CSV)</h2><p>Columns: crop, state, season, year, area_ha, annual_rainfall (optional). Up to 500 rows, processed on your device.</p></div>
        <button type="button" className="btn btn-text btn-sm" onClick={() => download("yield-template.csv", TEMPLATE)}><MIcon name="download" size={18} /> Template</button>
      </div>
      <label className="dropzone small-drop">
        <MIcon name="upload_file" size={30} />
        <b>Choose a CSV file</b>
        <small>Crop, state and season names as in the yield predictor (e.g. "Rapeseed &amp;Mustard", "Kharif")</small>
        <input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {error && <p className="field-error mt-2" role="alert">{error}</p>}
      {result && (
        <>
          <div className="d-flex flex-wrap align-items-center gap-2 my-3">
            <span className="chip small on">{ok.length} scored</span>
            {result.length - ok.length > 0 && <span className="chip small">{result.length - ok.length} skipped</span>}
            <span className="muted small">Total production {ok.reduce((s, r) => s + Number(r.production_t), 0).toFixed(1)} t</span>
            <button type="button" className="btn btn-tonal btn-sm ms-auto" onClick={() => download("yield-predictions.csv", toCsv(result))}><MIcon name="download" size={18} /> Download results</button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm data-table">
              <thead><tr><th>Crop</th><th>State</th><th>Season</th><th>Year</th><th>Area (ha)</th><th>Yield (t/ha)</th><th>Production (t)</th><th>Note</th></tr></thead>
              <tbody>{result.slice(0, 50).map((r, i) => <tr key={i}><td>{r.crop}</td><td>{r.state}</td><td>{r.season}</td><td>{r.year}</td><td>{r.area_ha}</td><td>{r.yield_t_ha}</td><td>{r.production_t}</td><td className="muted">{r.note}</td></tr>)}</tbody>
            </table>
          </div>
          {result.length > 50 && <p className="muted small">Showing 50 of {result.length} rows — download for all.</p>}
        </>
      )}
    </section>
  );
}
