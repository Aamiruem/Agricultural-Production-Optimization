import { AlertTriangle, CheckCircle2, CircleHelp, ExternalLink, Info, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { round } from "./geo";
import { isMissing, SOURCE_LEVELS } from "./sources";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (v) => (Array.isArray(v) ? v.join(", ") : typeof v === "number" ? round(v, 2) : String(v));

/** Small provenance tag for a sourced value. */
export function SourceTag({ v }) {
  if (!v) return null;
  if (isMissing(v))
    return (
      <span className="src-tag src-tag--missing" title={v.reason}>
        unavailable
      </span>
    );
  return (
    <span
      className={`src-tag src-tag--l${v.level}`}
      title={`${v.sourceName}\nType: ${v.type}\nResolution: ${v.resolution}${v.observedAt ? `\nObserved: ${v.observedAt}` : ""}\nRetrieved: ${v.retrievedAt}\nLevel ${v.level}: ${SOURCE_LEVELS[v.level] ?? ""}`}
    >
      {v.type} · {v.resolution}
    </span>
  );
}

export function ValueRow({ label, v, unit }) {
  const miss = isMissing(v);
  return (
    <div className={`val-row${miss ? " val-row--missing" : ""}`}>
      <dt>{label}</dt>
      <dd>
        {miss ? (
          <span className="val-missing">{v?.reason ?? "Not available"}</span>
        ) : (
          <b>
            {fmt(v.value)}
            {v.unit || unit ? ` ${v.unit ?? unit}` : ""}
          </b>
        )}
        <SourceTag v={v} />
        {!miss && v.note && <small className="val-note">{v.note}</small>}
      </dd>
    </div>
  );
}

const STATUS_ICON = {
  match: <CheckCircle2 size={16} className="st-match" aria-hidden="true" />,
  partial: <AlertTriangle size={16} className="st-partial" aria-hidden="true" />,
  mismatch: <XCircle size={16} className="st-mismatch" aria-hidden="true" />,
  missing: <CircleHelp size={16} className="st-missing" aria-hidden="true" />,
  "not comparable": <Info size={16} className="st-missing" aria-hidden="true" />,
};

export function LocationPanel({ local }) {
  const L = local.location;
  if (!L) return <p className="form-error">Location lookup failed: {local.locationError}</p>;
  return (
    <dl className="val-grid">
      <ValueRow label="Village / town (nearest named place)" v={L.village} />
      <ValueRow label="Locality / colony" v={L.locality} />
      <ValueRow label="Block" v={L.block} />
      <ValueRow label="Sub-district (tehsil/taluka)" v={L.subdistrict} />
      <ValueRow label="District" v={L.district} />
      <ValueRow label="State / UT" v={L.state} />
      <div className="val-row">
        <dt>Latitude, longitude</dt>
        <dd>
          <b>
            {L.lat}, {L.lon}
          </b>
          <span className="src-tag">WGS84</span>
        </dd>
      </div>
      <ValueRow label="Selected land area" v={local.area} />
      {!L.inIndia && (
        <p className="form-error">This point is outside India's boundary data; Indian datasets do not apply.</p>
      )}
      {L.displayName && <p className="muted-note">OpenStreetMap: {L.displayName}</p>}
    </dl>
  );
}

export function ClimatePanel({ local }) {
  const w = local.weather;
  const h = local.history;
  const c = w?.current;
  return (
    <div className="panel-stack">
      {local.weatherError && <p className="form-error">Weather: {local.weatherError}</p>}
      {c && (
        <>
          <p className="muted-note">
            Open-Meteo forecast model output for this point · valid {c.time} IST · type: modelled now-cast/forecast (not
            a station observation) ·{" "}
            <a href="https://mausam.imd.gov.in/" target="_blank" rel="noopener noreferrer">
              official IMD warnings <ExternalLink size={12} />
            </a>
          </p>
          <div className="wx-tiles">
            {[
              ["Temperature", c.temperature_2m, "°C"],
              ["Feels like", c.apparent_temperature, "°C"],
              ["Humidity", c.relative_humidity_2m, "%"],
              ["Rain now", c.precipitation, "mm"],
              ["Wind", c.wind_speed_10m, `km/h from ${c.wind_direction_10m}°`],
              ["Pressure", c.surface_pressure, "hPa"],
              ["Cloud cover", c.cloud_cover, "%"],
              ["Solar radiation", c.shortwave_radiation, "W/m²"],
            ].map(([k, v, u]) => (
              <div key={k} className="wx-tile">
                <small>{k}</small>
                <b>
                  {v ?? "—"} <span>{u}</span>
                </b>
              </div>
            ))}
          </div>
          <div className="table-scroll">
            <table className="site-table compact-table">
              <caption className="visually-hidden">7-day forecast</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Min–max °C</th>
                  <th scope="col">Rain mm</th>
                  <th scope="col">Rain chance</th>
                  <th scope="col">ET₀ mm</th>
                  <th scope="col">Solar MJ/m²</th>
                </tr>
              </thead>
              <tbody>
                {w.daily.time.map((t, i) => (
                  <tr key={t}>
                    <th scope="row">
                      {new Date(`${t}T00:00:00`).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </th>
                    <td>
                      {w.daily.temperature_2m_min[i]}–{w.daily.temperature_2m_max[i]}
                    </td>
                    <td>{w.daily.precipitation_sum[i]}</td>
                    <td>{w.daily.precipitation_probability_max?.[i] ?? "—"}%</td>
                    <td>{w.daily.et0_fao_evapotranspiration?.[i] ?? "—"}</td>
                    <td>{w.daily.shortwave_radiation_sum?.[i] ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div>
        <h4>Current season and conditions</h4>
        <p>
          IMD season: <b>{local.seasons.imd?.label}</b> · crop season: <b>{local.seasons.crop}</b>
        </p>
        {local.conditions?.flags?.length ? (
          <ul className="flag-list">
            {local.conditions.flags.map((f) => (
              <li key={f.id} className={`flag flag--${f.severity}`}>
                <b>{f.label}</b> — {f.detail}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-note">No heat, cold, waterlogging, drought or water-stress flags in the next 7 days.</p>
        )}
      </div>
      {local.historyError && <p className="form-error">Climate history: {local.historyError}</p>}
      {h && (
        <div className="chart-pair">
          <figure>
            <figcaption>
              Monthly rainfall normal ({h.years[0]}–{h.years.at(-1)}) · mean {h.annualMean} mm/yr · ERA5 reanalysis (~25
              km)
            </figcaption>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={h.monthly.map((m) => ({ ...m, name: MONTHS[m.month - 1] }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip formatter={(v) => `${v} mm`} />
                <Bar dataKey="rain" fill="#2171b5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
          <figure>
            <figcaption>
              Annual rainfall · trend {h.trendMmPerYear > 0 ? "+" : ""}
              {h.trendMmPerYear} mm/yr (10 years — short, not a climate trend)
            </figcaption>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={h.annual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={44} />
                <Tooltip formatter={(v) => `${v} mm`} />
                <Line type="monotone" dataKey="rain" stroke="#14532d" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </figure>
          <ul className="season-normals">
            {h.seasonal.map((s) => (
              <li key={s.id}>
                <small>{s.label}</small>
                <b>{s.rain} mm</b>
              </li>
            ))}
            <li>
              <small>Mean temperature / humidity</small>
              <b>
                {h.meanTemp} °C · {h.meanHumidity}%
              </b>
            </li>
            {h.departure && (
              <li>
                <small>
                  {h.departure.season} to {h.departure.upTo}
                </small>
                <b>
                  {h.departure.pct > 0 ? "+" : ""}
                  {h.departure.pct}% ({h.departure.category})
                </b>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SoilPanel({ local }) {
  const s = local.soil;
  const u = local.soilUser ?? {};
  return (
    <div className="panel-stack">
      {local.soilError && <p className="form-error">SoilGrids: {local.soilError}</p>}
      {s?.masked && (
        <p className="form-error">
          SoilGrids has no data at or within ~2 km of this point (built-up area or water). Enter a soil test below.
        </p>
      )}
      <h4>Your soil test (highest reliability)</h4>
      {Object.keys(u).length ? (
        <dl className="val-grid">
          {Object.entries(u).map(([k, v]) => (
            <ValueRow key={k} label={k} v={v} />
          ))}
        </dl>
      ) : (
        <p className="muted-note">
          No Soil Health Card or lab values entered. Available N, P, K, S, Zn, Fe, B and EC are only known from a soil
          test.
        </p>
      )}
      {s && !s.masked && (
        <>
          <h4>SoilGrids estimate (machine-learning model, not a soil test)</h4>
          <dl className="val-grid">
            <ValueRow label="Soil pH (water)" v={s.ph} />
            <ValueRow label="Texture class" v={s.texture} />
            <ValueRow label="Sand" v={s.sand} />
            <ValueRow label="Silt" v={s.silt} />
            <ValueRow label="Clay" v={s.clay} />
            <ValueRow label="Organic carbon" v={s.organicCarbon} />
            <ValueRow label="Total nitrogen" v={s.totalNitrogen} />
            <ValueRow label="CEC" v={s.cec} />
            <ValueRow label="Bulk density" v={s.bulkDensity} />
            <ValueRow label="Water-holding capacity" v={s.waterHolding} />
            <ValueRow label="Drainage" v={s.drainage} />
          </dl>
        </>
      )}
      <h4>Regional classification</h4>
      <dl className="val-grid">
        <ValueRow label="Regional soil classes (state)" v={local.soilRegional} />
      </dl>
      {local.soilIndicators?.length > 0 && (
        <ul className="flag-list">
          {local.soilIndicators.map((i) => (
            <li
              key={i.key}
              className={`flag flag--${i.deficient || ["alkalinity", "acidity", "salinity"].includes(i.key) ? "medium" : "low"}`}
            >
              <b>{i.label}</b> — {i.detail}
            </li>
          ))}
        </ul>
      )}
      <p className="muted-note">
        Soil moisture (modelled, top 0–1 cm / 9–27 cm):{" "}
        {local.weather?.hourly
          ? `${local.weather.hourly.soil_moisture_0_to_1cm?.[0] ?? "—"} / ${local.weather.hourly.soil_moisture_9_to_27cm?.[0] ?? "—"} m³/m³ (Open-Meteo)`
          : "unavailable"}
      </p>
    </div>
  );
}

export function AgriculturePanel({ local }) {
  const a = local.agriculture;
  const stats = isMissing(a.stats) ? null : a.stats.value;
  return (
    <div className="panel-stack">
      {a.zone && (
        <p>
          Agro-climatic setting: <b>{a.zone}</b> <span className="src-tag src-tag--l5">reference · state</span>
        </p>
      )}
      <h4>Major crops (state statistics, last 5 recorded years)</h4>
      {stats ? (
        <>
          <p className="muted-note">
            crop_yield.csv · {stats.records} records {stats.firstYear}–{stats.latestYear} · <b>state level</b> —
            district and village crop statistics are not in this dataset.
          </p>
          <div className="table-scroll">
            <table className="site-table compact-table">
              <thead>
                <tr>
                  <th scope="col">Crop</th>
                  <th scope="col">Avg area (ha)</th>
                  <th scope="col">Median yield (t/ha)</th>
                  <th scope="col">Seasons</th>
                </tr>
              </thead>
              <tbody>
                {stats.crops.slice(0, 10).map((c) => (
                  <tr key={c.crop}>
                    <th scope="row">{c.crop}</th>
                    <td>{c.avgAreaHa.toLocaleString("en-IN")}</td>
                    <td>{c.medianYield ?? "—"}</td>
                    <td>{c.seasons.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="form-error">{a.stats.reason}</p>
      )}
      <dl className="val-grid">
        <ValueRow label="Reference crop list (state)" v={a.referenceCrops} />
        <ValueRow label="Groundwater" v={a.groundwater} />
        <ValueRow label="Irrigation" v={local.irrigation} />
      </dl>
      <h4>Crop calendar</h4>
      <ul className="season-normals">
        <li>
          <small>Kharif</small>
          <b>sow Jun–Jul · harvest Sep–Oct</b>
        </li>
        <li>
          <small>Rabi</small>
          <b>sow Oct–Dec · harvest Mar–Apr</b>
        </li>
        <li>
          <small>Zaid</small>
          <b>sow Mar–Apr · harvest Jun</b>
        </li>
      </ul>
      <h4>Pest and disease hotspots this season</h4>
      {a.pests.length ? (
        <ul className="pest-list">
          {a.pests.map((d) => (
            <li key={d.id}>
              <b>{d.en}</b>{" "}
              <small>
                ({d.type}; {d.crops.join(", ")})
              </small>{" "}
              — {d.conditions}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-note">No listed hotspots for this state and season in the AgriSmart library.</p>
      )}
      <p className="muted-note">
        Hotspots summarise ICAR / state department reports of where problems are historically common — not live outbreak
        data.
      </p>
      <h4>Market prices (mandi)</h4>
      {a.market?.unavailable ? (
        <p className="muted-note">
          {a.market.reason} Check{" "}
          <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer">
            AGMARKNET
          </a>{" "}
          or{" "}
          <a href="https://enam.gov.in/web/" target="_blank" rel="noopener noreferrer">
            e-NAM
          </a>
          .
        </p>
      ) : a.market?.records?.length ? (
        <div className="table-scroll">
          <table className="site-table compact-table">
            <thead>
              <tr>
                <th scope="col">Market</th>
                <th scope="col">Commodity</th>
                <th scope="col">Modal ₹/qtl</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {a.market.records.slice(0, 12).map((r, i) => (
                <tr key={i}>
                  <th scope="row">{r.market}</th>
                  <td>{r.commodity}</td>
                  <td>{r.modal_price}</td>
                  <td>{r.arrival_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted-note">No mandi records returned for this district.</p>
      )}
    </div>
  );
}

export function ComparisonPanel({ result, quality }) {
  if (!result) return null;
  if (result.noLocation) return <p className="doctor-note">{result.message}</p>;
  const cmp = result.comparison;
  return (
    <div className="panel-stack">
      <div className="score-row">
        <div className="score-card">
          <small>Data match score</small>
          <b>{cmp.score == null ? "—" : `${cmp.score}%`}</b>
          <span>over {cmp.coverage}% of weighted parameters</span>
        </div>
        <div className="score-card">
          <small>Records matched</small>
          <b>{result.matchedRecords}</b>
          <span>level: {result.matchLevel}</span>
        </div>
        <div className="score-card">
          <small>Geographic confidence</small>
          <b>{cmp.confidence.geographic.level}</b>
          <span>{cmp.confidence.geographic.detail}</span>
        </div>
        <div className="score-card">
          <small>Temporal confidence</small>
          <b>{cmp.confidence.temporal.level}</b>
          <span>{cmp.confidence.temporal.detail}</span>
        </div>
        <div className="score-card">
          <small>Local source reliability</small>
          <b>{cmp.confidence.reliability.level}</b>
          <span>
            avg source level {cmp.confidence.reliability.averageSourceLevel ?? "—"} (1 = lab test, 5 = regional)
          </span>
        </div>
        {quality && (
          <div className="score-card">
            <small>Dataset quality</small>
            <b>{quality.score}%</b>
            <span>{quality.rows.toLocaleString("en-IN")} rows checked</span>
          </div>
        )}
      </div>
      <p className="medical-disclaimer">
        <Info size={18} aria-hidden="true" />
        <span>
          {cmp.disclaimer} Formula: {cmp.formula}. Missing values are excluded, not counted as matches.
        </span>
      </p>
      <div className="table-scroll">
        <table className="site-table compact-table cmp-table">
          <caption className="visually-hidden">Parameter comparison</caption>
          <thead>
            <tr>
              <th scope="col">Parameter</th>
              <th scope="col">My dataset</th>
              <th scope="col">Local area data</th>
              <th scope="col">Similarity</th>
              <th scope="col">Weight</th>
              <th scope="col">Match status</th>
            </tr>
          </thead>
          <tbody>
            {cmp.rows.map((r) => (
              <tr key={r.key} className={`cmp-${r.status.replace(" ", "-")}`}>
                <th scope="row">
                  {r.label}
                  {r.unit ? <small> ({r.unit})</small> : null}
                </th>
                <td>{r.dataset ?? "—"}</td>
                <td>{r.local ?? "—"}</td>
                <td>
                  {r.similarity == null ? "—" : `${Math.round(r.similarity * 100)}%`}
                  {r.difference != null && <small> Δ {r.difference}</small>}
                  {r.distanceKm != null && <small> {r.distanceKm} km</small>}
                </td>
                <td>{r.weight}</td>
                <td>
                  {STATUS_ICON[r.status]} {r.status}
                  {r.basis && <small className="val-note">{r.basis}</small>}
                  {r.tolerance && r.similarity != null && <small className="val-note">tolerance {r.tolerance}</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SchemaTable schema={result.schema} />
    </div>
  );
}

export function SchemaTable({ schema }) {
  if (!schema) return null;
  return (
    <details className="schema-details">
      <summary>Detected dataset schema ({schema.fields.length} columns)</summary>
      <div className="table-scroll">
        <table className="site-table compact-table">
          <thead>
            <tr>
              <th scope="col">Column</th>
              <th scope="col">Understood as</th>
              <th scope="col">Confidence</th>
              <th scope="col">Numeric share</th>
            </tr>
          </thead>
          <tbody>
            {schema.fields.map((f) => (
              <tr key={f.header}>
                <th scope="row">{f.header}</th>
                <td>{f.canonical ?? <em>not used</em>}</td>
                <td>{f.confidence ? `${Math.round(f.confidence * 100)}%` : "—"}</td>
                <td>{Math.round(f.numericShare * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function QualityPanel({ quality }) {
  if (!quality) return null;
  return (
    <div className="panel-stack">
      <div className="score-row">
        {Object.entries(quality.parts).map(([k, v]) => (
          <div key={k} className="score-card">
            <small>{k}</small>
            <b>{v == null ? "n/a" : `${v}%`}</b>
          </div>
        ))}
      </div>
      {quality.issues.length ? (
        <ul className="flag-list">
          {quality.issues.slice(0, 12).map((i) => (
            <li key={i} className="flag flag--low">
              {i}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-note">No quality issues found.</p>
      )}
      <p className="muted-note">
        Quality = 30% completeness + 15% uniqueness + 20% validity (plausible ranges) + 15% outliers (3×IQR) + 10%
        consistency (production ÷ area ≈ yield) + 10% timeliness.
      </p>
    </div>
  );
}

export function CropsPanel({ suitability }) {
  if (!suitability) return null;
  return (
    <div className="panel-stack">
      <p className="muted-note">
        {suitability.season} season · seasonal normal {suitability.seasonTemp ?? "—"} °C and{" "}
        {suitability.seasonRain ?? "—"} mm ·{" "}
        {suitability.mlUsed
          ? "ML model used (soil-test N, P, K provided)"
          : "ML model not used — it needs soil-test N, P, K"}
      </p>
      <ol className="crop-ranking">
        {suitability.top.map((c) => (
          <li key={c.crop} className="crop-rank-card">
            <header>
              {c.image && <img src={c.image} alt="" width="56" height="56" loading="lazy" />}
              <div>
                <h4>{c.crop}</h4>
                <small>{c.group}</small>
              </div>
              <span className="crop-score" aria-label={`Suitability ${c.score} out of 100`}>
                {c.score}
              </span>
            </header>
            <ul className="crop-parts">
              {Object.entries(c.parts).map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span>
                  <i style={{ "--w": `${v}%` }} />
                  <b>{v}</b>
                </li>
              ))}
            </ul>
            <p>
              <b>Why:</b> {c.reasons.join("; ") || "—"}
            </p>
            {c.cautions.length > 0 && (
              <p>
                <b>Watch:</b> {c.cautions.join("; ")}
              </p>
            )}
            {c.risks.length > 0 && (
              <p className="form-error">
                <b>Current risks:</b> {c.risks.join("; ")}
              </p>
            )}
            <dl className="crop-facts">
              <div>
                <dt>Sowing</dt>
                <dd>{c.sowing}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{c.duration ? `${c.duration} days` : "—"}</dd>
              </div>
              <div>
                <dt>Water need</dt>
                <dd>
                  {c.water} (~{c.waterNeedMm} mm/yr)
                </dd>
              </div>
              <div>
                <dt>Historical yield ({c.yieldRange?.level ?? "—"})</dt>
                <dd>
                  {c.yieldRange
                    ? `${c.yieldRange.p25}–${c.yieldRange.p75} t/ha (median ${c.yieldRange.median}, n=${c.yieldRange.n})`
                    : "No state records"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
      {suitability.avoid.length > 0 && (
        <details>
          <summary>Crops to avoid now ({suitability.avoid.length})</summary>
          <ul className="pest-list">
            {suitability.avoid.slice(0, 25).map((a) => (
              <li key={a.crop}>
                <b>{a.crop}</b> — {a.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="muted-note">{suitability.method}</p>
    </div>
  );
}

export function YieldPanel({ result }) {
  if (!result) return null;
  return (
    <div className="panel-stack">
      <div className="score-row">
        <div className="score-card">
          <small>Expected yield</small>
          <b>{result.yieldTHa} t/ha</b>
          <span>{result.rangeTHa ? `range ${result.rangeTHa[0]}–${result.rangeTHa[1]} t/ha` : "no interval"}</span>
        </div>
        <div className="score-card">
          <small>Estimated production</small>
          <b>{result.productionT} t</b>
          <span>{result.productionRangeT ? `${result.productionRangeT[0]}–${result.productionRangeT[1]} t` : ""}</span>
        </div>
        <div className="score-card">
          <small>Area used</small>
          <b>{round(result.areaHa, 3)} ha</b>
          <span>{result.season}</span>
        </div>
      </div>
      <p>{result.formula}</p>
      <p className={result.insufficientLocalData ? "form-error" : "muted-note"}>{result.note}</p>
      <p className="muted-note">
        Model: {result.model} ({result.engine === "browser" ? "browser copy" : "API"}) · {result.resolution} · rainfall
        input {result.rainfallUsed ?? "dataset normal"} mm/yr (ERA5 10-yr mean). Evaluation: time-based split (train
        before 2015, test 2015–2020); see <a href="/insights">model insights</a>.
      </p>
    </div>
  );
}

/** Section G: what matches, what does not, what is missing and what to test. */
export function DecisionPanel({ local, comparison, suitability }) {
  const missingSoilTest = !Object.keys(local.soilUser ?? {}).some((k) => ["N", "P", "K"].includes(k));
  const cmp = comparison?.comparison;
  const reliable = [];
  const tentative = [];
  if (local.weather) reliable.push("7-day weather and current conditions (model forecast, updated hourly)");
  if (local.history) reliable.push("Rainfall and temperature normals (10 years of ERA5 reanalysis)");
  if (suitability)
    (missingSoilTest ? tentative : reliable).push(
      `Crop shortlist (${suitability.top.map((t) => t.crop).join(", ")})${missingSoilTest ? " — without a soil test" : ""}`,
    );
  if (local.soil && !local.soil.masked)
    tentative.push("Soil properties from SoilGrids (modelled at 250 m — field variation is not captured)");
  tentative.push("Crop statistics and yields (state level, latest 2019–2020)");
  const tests = [];
  if (missingSoilTest) tests.push("Soil test (Soil Health Card): available N, P, K, pH, EC, OC and S, Zn, Fe, B");
  if (isMissing(local.irrigation)) tests.push("Confirm irrigation source and reliability (tube well, canal, rain-fed)");
  if (local.soil?.masked) tests.push("Soil sample from the field — SoilGrids has no data at this point");
  tests.push("Local variety recommendation from your Krishi Vigyan Kendra");
  return (
    <div className="decision-grid">
      <div>
        <h4>What matches</h4>
        <p>
          {cmp?.matched?.length
            ? cmp.matched.map((k) => k).join(", ")
            : "Run Compare My Dataset to see field-by-field matches."}
        </p>
        <h4>What does not match</h4>
        <p>{cmp ? [...cmp.mismatched, ...cmp.partial.map((k) => `${k} (partial)`)].join(", ") || "Nothing" : "—"}</p>
        <h4>What data is missing</h4>
        <p>
          {cmp
            ? [...cmp.missing, ...cmp.notComparable.map((k) => `${k} (different basis)`)].join(", ") || "Nothing"
            : "—"}
        </p>
      </div>
      <div>
        <h4>More reliable</h4>
        <ul>
          {reliable.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h4>Treat as indicative</h4>
        <ul>
          {tentative.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h4>Tests and checks still needed</h4>
        <ul>
          {tests.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
