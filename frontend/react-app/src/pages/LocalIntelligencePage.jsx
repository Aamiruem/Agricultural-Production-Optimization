import {
  BarChart3,
  Crosshair,
  Database,
  Download,
  FileText,
  Loader2,
  LocateFixed,
  MapPinned,
  PenLine,
  Printer,
  Search,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { PageHero, SectionTitle } from "@/components/site/SiteKit";
import {
  buildDataset,
  compareDataset,
  cropSuitability,
  datasetQuality,
  gatherLocal,
  loadBuiltinDataset,
  predictCropYield,
} from "@/features/local/analyze";
import { CROP_SEASONS } from "@/features/local/climate";
import { BUILTIN_DATASETS } from "@/features/local/dataset";
import { AREA_UNITS, convertArea, ringAreaM2, ringCentroid, round } from "@/features/local/geo";
import { IntelMap } from "@/features/local/IntelMap";
import { buildChoropleth, MAP_LAYERS, UNAVAILABLE_LAYERS } from "@/features/local/mapLayers";
import { DEFAULT_WEIGHTS, PARAM_LABELS } from "@/features/local/matching";
import { downloadText, reportCsv } from "@/features/local/report";
import {
  AgriculturePanel,
  ClimatePanel,
  ComparisonPanel,
  CropsPanel,
  DecisionPanel,
  LocationPanel,
  QualityPanel,
  SoilPanel,
  YieldPanel,
} from "@/features/local/ResultsPanels";
import { backendStatus, searchPlaces } from "@/features/local/services";
import { buildSuggestions } from "@/features/local/suggestions";
import { YIELD_NAME } from "@/features/local/suitability";
import { ATLAS_CROPS } from "@/lib/atlas";

const IDLE = { status: "idle", message: "" };
const SOIL_FIELDS = [
  ["N", "Available N", "kg/ha"],
  ["P", "Available P", "kg/ha"],
  ["K", "Available K", "kg/ha"],
  ["ph", "pH", ""],
  ["ec", "EC", "dS/m"],
  ["oc", "Organic carbon", "%"],
  ["S", "Sulphur", "ppm"],
  ["Zn", "Zinc", "ppm"],
  ["Fe", "Iron", "ppm"],
  ["B", "Boron", "ppm"],
];
const YIELD_CROPS = ATLAS_CROPS.filter((c) => YIELD_NAME[c.name]).map((c) => c.name);

function StatusLine({ s }) {
  if (!s || s.status === "idle") return null;
  return (
    <p className={`action-status action-status--${s.status}`} role={s.status === "error" ? "alert" : "status"}>
      {s.status === "loading" && <Loader2 size={15} className="spin" aria-hidden="true" />} {s.message}
    </p>
  );
}

function ActionButton({ icon: Icon, label, onClick, state, disabled, primary }) {
  return (
    <div className="action-cell">
      <button
        type="button"
        className={`site-btn ${primary ? "site-btn--primary" : "site-btn--light"} action-btn`}
        onClick={onClick}
        disabled={disabled || state?.status === "loading"}
      >
        {state?.status === "loading" ? (
          <Loader2 size={18} className="spin" aria-hidden="true" />
        ) : (
          <Icon size={18} aria-hidden="true" />
        )}{" "}
        {label}
      </button>
      <StatusLine s={state} />
    </div>
  );
}

export default function LocalIntelligencePage() {
  const [point, setPoint] = useState(null);
  const [mode, setMode] = useState("point");
  const [polygon, setPolygon] = useState([]);
  const [flyTarget, setFlyTarget] = useState(null);
  const [selState, setSelState] = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);
  const [layer, setLayer] = useState("none");
  const [layerCrop, setLayerCrop] = useState("Wheat");
  const [choropleth, setChoropleth] = useState(null);
  const [layerState, setLayerState] = useState(IDLE);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [areaValue, setAreaValue] = useState("");
  const [areaUnit, setAreaUnit] = useState("acre");
  const [irrigation, setIrrigation] = useState("unknown");
  const [season, setSeason] = useState("");
  const [previousCrop, setPreviousCrop] = useState("");
  const [soilCard, setSoilCard] = useState({});

  const [datasetId, setDatasetId] = useState("crop_yield");
  const [upload, setUpload] = useState(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [cropFilter, setCropFilter] = useState("");
  const [yieldCrop, setYieldCrop] = useState("Wheat");

  const [local, setLocal] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [quality, setQuality] = useState(null);
  const [suitability, setSuitability] = useState(null);
  const [yieldResult, setYieldResult] = useState(null);
  const [reportReady, setReportReady] = useState(false);
  const [st, setSt] = useState({});
  const set = (key, status, message = "") => setSt((s) => ({ ...s, [key]: { status, message } }));
  const resultsRef = useRef(null);

  // ---------------------------------------------------------------- area
  const drawnHa = polygon.length >= 3 ? ringAreaM2(polygon) / 1e4 : null;
  const area = useMemo(() => {
    if (drawnHa != null)
      return {
        ha: drawnHa,
        note: `Drawn field polygon, geodesic area ${round(drawnHa, 4)} ha (${round(drawnHa * 2.471054, 3)} acres)`,
      };
    if (areaValue !== "" && Number(areaValue) > 0) {
      const c = convertArea(Number(areaValue), areaUnit, "ha");
      return {
        ha: c.value,
        note: `${areaValue} ${AREA_UNITS[areaUnit].label} → ${round(c.value, 4)} ha (${c.explanation})`,
      };
    }
    return { ha: null, note: null };
  }, [drawnHa, areaValue, areaUnit]);

  const choose = useCallback((p, label) => {
    setPoint(p);
    setLocal(null);
    setComparison(null);
    setSuitability(null);
    setYieldResult(null);
    setReportReady(false);
    set("locate", "success", label ?? `Point selected: ${p[0].toFixed(5)}, ${p[1].toFixed(5)}`);
  }, []);

  // ---------------------------------------------------------------- 1. GPS
  const detect = () => {
    if (!("geolocation" in navigator))
      return set(
        "locate",
        "error",
        "This browser cannot share location. Search for your village or tap the map instead.",
      );
    set("locate", "loading", "Asking your browser for permission to use your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        choose(
          p,
          `Location received (±${Math.round(pos.coords.accuracy)} m accuracy). We have not assumed any village — run Analyze My Area to identify it.`,
        );
        setFlyTarget({ point: p, zoom: 14 });
      },
      (err) =>
        set(
          "locate",
          "error",
          err.code === 1
            ? "Location permission was denied. Search for your village/colony below or tap your farm on the map."
            : `Could not get your location (${err.message}). Search or tap the map instead.`,
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  // ---------------------------------------------------------------- 2. search
  const doSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3)
      return set("search", "empty", "Type at least 3 letters of a village, town, colony or locality.");
    set("search", "loading", "Searching OpenStreetMap…");
    try {
      const r = await searchPlaces(query);
      setResults(r.results);
      if (!r.results.length)
        set(
          "search",
          "empty",
          `No place called “${query}” found in India. Try the district name too (e.g. “Sahnewal, Ludhiana”).`,
        );
      else set("search", "success", `${r.results.length} places found — pick the right one.`);
    } catch (err) {
      set("search", "error", `Search failed: ${err.message}`);
    }
  };

  // ---------------------------------------------------------------- map layer
  const layerReq = useRef(0);
  const changeLayer = (id, crop = layerCrop) => {
    setLayer(id);
    setLayerCrop(crop);
    const req = ++layerReq.current;
    if (id === "none") {
      setChoropleth(null);
      setLayerState(IDLE);
      return;
    }
    setLayerState({ status: "loading", message: "Loading layer…" });
    buildChoropleth(id, { crop }).then(
      (c) => {
        if (req !== layerReq.current) return;
        setChoropleth(c);
        setLayerState({ status: "success", message: c?.note ?? "" });
      },
      (err) => req === layerReq.current && setLayerState({ status: "error", message: `Layer failed: ${err.message}` }),
    );
  };

  // ---------------------------------------------------------------- 4. fetch local data
  const ensurePoint = (key) => {
    if (!point) {
      set(key, "empty", "Select a location first: detect GPS, search, or tap the map.");
      return false;
    }
    return true;
  };

  const fetchLocal = async (key = "fetch") => {
    if (!ensurePoint(key)) return null;
    set(key, "loading", "Fetching location, weather, 10-year climate, soil and agriculture data…");
    try {
      const data = await gatherLocal({
        point,
        areaHa: area.ha,
        areaNote: area.note,
        userSoil: soilCard,
        irrigation: irrigation === "unknown" ? null : irrigation === "yes",
        season: season || null,
      });
      setLocal(data);
      const errs = [data.locationError, data.weatherError, data.historyError, data.soilError].filter(Boolean);
      set(
        key,
        errs.length ? "error" : "success",
        errs.length
          ? `Fetched with gaps: ${errs.join(" · ")}`
          : `Data fetched (${data.location?.via === "backend" ? "via AgriSmart API" : "directly from public APIs"}).`,
      );
      return data;
    } catch (err) {
      set(key, "error", `Fetch failed: ${err.message}`);
      return null;
    }
  };

  const currentDataset = async () => (datasetId === "upload" ? upload : loadBuiltinDataset(datasetId));

  // ---------------------------------------------------------------- 6/7
  const runCompare = async (data = local) => {
    if (!data) return set("compare", "empty", "Fetch local data or run Analyze My Area first.");
    set("compare", "loading", "Matching dataset records to this location…");
    try {
      const ds = await currentDataset();
      if (!ds) return set("compare", "empty", "Upload a CSV first or choose a built-in dataset.");
      const res = compareDataset(ds, data, { weights, cropFilter: cropFilter || null });
      setComparison(res);
      if (res.noLocation)
        set("compare", "empty", "This dataset has no location columns — see the explanation in section E.");
      else if (!res.matchedRecords)
        set("compare", "empty", `No records for ${data.location?.state?.value ?? "this location"} in the dataset.`);
      else
        set(
          "compare",
          "success",
          `Compared ${res.matchedRecords} records (${res.matchLevel}). Match score ${res.comparison.score ?? "—"}% over ${res.comparison.coverage}% coverage.`,
        );
      return res;
    } catch (err) {
      set("compare", "error", `Comparison failed: ${err.message}`);
      return null;
    }
  };

  const runQuality = async () => {
    set("quality", "loading", "Checking completeness, duplicates, conflicts, ranges and outliers…");
    try {
      const ds = await currentDataset();
      if (!ds) return set("quality", "empty", "Upload a CSV first or choose a built-in dataset.");
      const q = datasetQuality(ds);
      setQuality(q);
      set(
        "quality",
        "success",
        `Dataset quality ${q.score}% across ${q.rows.toLocaleString("en-IN")} rows · ${q.issues.length} issue types.`,
      );
    } catch (err) {
      set("quality", "error", `Validation failed: ${err.message}`);
    }
  };

  // ---------------------------------------------------------------- 8/9
  const runCrops = (data = local) => {
    if (!data) return set("crops", "empty", "Fetch local data or run Analyze My Area first.");
    if (!data.location?.state?.value)
      return set("crops", "error", "State could not be identified, so crop statistics cannot be used.");
    const s = cropSuitability(data, { season: season || data.seasons.crop, irrigation: irrigation === "yes" });
    setSuitability(s);
    set(
      "crops",
      s.top.length ? "success" : "empty",
      s.top.length
        ? `Top crops: ${s.top.map((t) => t.crop).join(", ")}`
        : "No in-season crop could be scored with the available data.",
    );
    return s;
  };

  const runYield = async () => {
    if (!local) return set("yield", "empty", "Fetch local data or run Analyze My Area first.");
    if (!area.ha) return set("yield", "empty", "Enter your farm area or draw the field on the map.");
    set("yield", "loading", "Running the yield model…");
    try {
      const crop = ATLAS_CROPS.find((c) => c.name === yieldCrop);
      const s = season || local.seasons.crop;
      const seasonForCrop = crop.seasons.includes(s)
        ? s
        : (crop.seasons.find((x) => ["Kharif", "Rabi", "Zaid", "Whole Year"].includes(x)) ?? s);
      const r = await predictCropYield(local, { crop: yieldCrop, season: seasonForCrop, areaHa: area.ha });
      setYieldResult(r);
      set("yield", "success", `${r.crop}: ${r.yieldTHa} t/ha → ${r.productionT} t on ${round(area.ha, 3)} ha.`);
    } catch (err) {
      set("yield", "error", `Yield prediction failed: ${err.response?.data?.detail ?? err.message}`);
    }
  };

  // ---------------------------------------------------------------- 5. analyze everything
  const analyze = async () => {
    const data = await fetchLocal("analyze");
    if (!data) return;
    set("analyze", "loading", "Comparing your dataset and scoring crops…");
    await runCompare(data);
    runCrops(data);
    set("analyze", "success", "Analysis complete — see sections A–G below.");
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  // ---------------------------------------------------------------- 10/11 report
  const generateReport = () => {
    if (!local) return set("report", "empty", "Run Analyze My Area first.");
    setReportReady(true);
    set("report", "success", "Report assembled below with every value's source. Download it as CSV or print to PDF.");
    setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const downloadCsv = () => {
    if (!local) return set("download", "empty", "Nothing to download yet — run Analyze My Area first.");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    downloadText(
      `agrismart-analysis-${stamp}.csv`,
      reportCsv({ local, comparison, quality, suitability, yieldResult }),
    );
    set("download", "success", "CSV downloaded.");
  };
  const printPdf = () => {
    if (!local) return set("download", "empty", "Nothing to print yet — run Analyze My Area first.");
    setReportReady(true);
    setTimeout(() => window.print(), 100);
  };

  // ---------------------------------------------------------------- upload
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return set("upload", "error", "File is larger than 20 MB.");
    try {
      const ds = buildDataset(await file.text(), {
        id: "upload",
        label: file.name,
        source: "user",
        resolution: "as detected",
        units: {},
      });
      setUpload(ds);
      setDatasetId("upload");
      const mapped = Object.keys(ds.schema.mapping);
      set(
        "upload",
        mapped.length ? "success" : "empty",
        mapped.length
          ? `${ds.rawCount} rows · understood ${mapped.length} columns (${mapped.join(", ")})${ds.schema.hasLocation ? "" : " · no location columns"}`
          : "No recognisable columns. Use headers like State, District, Latitude, Longitude, pH, N, Rainfall, Crop, Year.",
      );
    } catch (err) {
      set("upload", "error", `Could not read the file: ${err.message}`);
    }
  };

  const suggestions = useMemo(
    () => (local ? buildSuggestions(local, suitability, { previousCrop }) : null),
    [local, suitability, previousCrop],
  );

  return (
    <div className="site-page local-intel">
      <PageHero
        kicker="Local agriculture intelligence"
        title="Analyze My Agricultural Location"
        lead="Pick your farm anywhere in India — by GPS, village search or the map — to fetch local weather, 10-year climate, soil and crop data, compare it with your dataset, and get explained crop and yield predictions. Every value shows its source and resolution."
        image="ai/satellite-monitoring"
        imageAlt="Satellite view of agricultural fields"
        compact
      >
        <button type="button" className="site-btn site-btn--gold" onClick={detect}>
          <LocateFixed size={18} aria-hidden="true" /> Analyze my current location
        </button>
      </PageHero>

      {/* ------------------------------------------------ dashboard */}
      <section className="site-section intel-dashboard" aria-labelledby="dash-title">
        <SectionTitle id="dash-title" kicker="Step 1" title="Choose a location" />
        <div className="intel-grid">
          <div className="intel-controls">
            <ActionButton
              icon={LocateFixed}
              label="Detect My Current Location"
              onClick={detect}
              state={st.locate}
              primary
            />
            <form className="search-form" onSubmit={doSearch} role="search">
              <label htmlFor="place-q" className="visually-hidden">
                Village, town, colony or locality
              </label>
              <input
                id="place-q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Village, town, colony… e.g. Sahnewal, Ludhiana"
              />
              <button
                type="submit"
                className="site-btn site-btn--light action-btn"
                disabled={st.search?.status === "loading"}
              >
                <Search size={18} aria-hidden="true" /> Search My Village / Colony
              </button>
            </form>
            <StatusLine s={st.search} />
            {results.length > 0 && (
              <ul className="place-results">
                {results.map((r) => (
                  <li key={`${r.lat},${r.lon}`}>
                    <button
                      type="button"
                      onClick={() => {
                        choose([r.lat, r.lon], `Selected ${r.name} (${r.type}).`);
                        setFlyTarget(
                          r.bbox
                            ? {
                                bounds: [
                                  [r.bbox[0], r.bbox[2]],
                                  [r.bbox[1], r.bbox[3]],
                                ],
                              }
                            : { point: [r.lat, r.lon], zoom: 14 },
                        );
                        setResults([]);
                      }}
                    >
                      <b>{r.name}</b>
                      <small>{r.displayName}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="action-cell">
              <div className="mode-toggle" role="group" aria-label="Map selection mode">
                <button
                  type="button"
                  className={`site-btn site-btn--sm ${mode === "point" ? "site-btn--primary" : "site-btn--light"}`}
                  onClick={() => setMode("point")}
                >
                  <Crosshair size={16} aria-hidden="true" /> Select point on India map
                </button>
                <button
                  type="button"
                  className={`site-btn site-btn--sm ${mode === "draw" ? "site-btn--primary" : "site-btn--light"}`}
                  onClick={() => {
                    setMode("draw");
                    set("draw", "success", "Tap the corners of your field on the map, then press Finish.");
                  }}
                >
                  <PenLine size={16} aria-hidden="true" /> Select Area on India Map (draw field)
                </button>
              </div>
              {mode === "draw" && (
                <div className="mode-toggle">
                  <button
                    type="button"
                    className="site-btn site-btn--sm site-btn--light"
                    onClick={() => setPolygon((p) => p.slice(0, -1))}
                    disabled={!polygon.length}
                  >
                    <Undo2 size={15} aria-hidden="true" /> Undo
                  </button>
                  <button
                    type="button"
                    className="site-btn site-btn--sm site-btn--light"
                    onClick={() => setPolygon([])}
                    disabled={!polygon.length}
                  >
                    <X size={15} aria-hidden="true" /> Clear
                  </button>
                  <button
                    type="button"
                    className="site-btn site-btn--sm site-btn--primary"
                    disabled={polygon.length < 3}
                    onClick={() => {
                      setMode("point");
                      choose(
                        ringCentroid(polygon),
                        `Field drawn: ${round(drawnHa, 4)} ha. Point set to the field centre.`,
                      );
                    }}
                  >
                    Finish field
                  </button>
                </div>
              )}
              <StatusLine s={st.draw} />
              {drawnHa != null && (
                <p className="muted-note">
                  Field area (geodesic): <b>{round(drawnHa, 4)} ha</b> = {round(drawnHa * 2.471054, 3)} acres ·{" "}
                  {polygon.length} corners. This is geographic area; cultivable area may be smaller (bunds, paths,
                  buildings).
                </p>
              )}
            </div>
            <div className="layer-picker">
              <label htmlFor="layer">Map layer</label>
              <select id="layer" value={layer} onChange={(e) => changeLayer(e.target.value)}>
                {MAP_LAYERS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              {layer === "suitability" && (
                <select
                  aria-label="Crop for suitability layer"
                  value={layerCrop}
                  onChange={(e) => changeLayer("suitability", e.target.value)}
                >
                  {ATLAS_CROPS.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              )}
              <StatusLine s={layerState} />
              <details>
                <summary>Layers not available (and why)</summary>
                <ul className="pest-list">
                  {UNAVAILABLE_LAYERS.map((u) => (
                    <li key={u.label}>
                      <b>{u.label}</b> — {u.reason}
                    </li>
                  ))}
                </ul>
                <p className="muted-note">
                  Soil pH, organic carbon, nitrogen and clay rasters (SoilGrids) are in the map's layer menu (top
                  right).
                </p>
              </details>
            </div>
          </div>
          <IntelMap
            point={point}
            polygon={polygon}
            mode={mode}
            onPick={(p) => choose(p)}
            onVertex={(p) => setPolygon((ring) => [...ring, p])}
            flyTarget={flyTarget}
            selectedState={selState}
            selectedDistrictLgd={selDistrict}
            onStateClick={(f, p) => {
              setSelState(f.properties.slug);
              setSelDistrict(null);
              choose(
                p,
                `Selected a point in ${f.properties.name}. Districts are now shown; tap a district for its sub-districts.`,
              );
            }}
            onDistrictClick={(f, p) => {
              setSelDistrict(f.properties.lgd);
              choose(p, `Selected a point in ${f.properties.name} district. Sub-districts (tehsils) are shown.`);
            }}
            choropleth={choropleth}
            soilSample={local?.soil?.sample}
          />
        </div>
      </section>

      {/* ------------------------------------------------ farm inputs */}
      <section className="site-section" aria-labelledby="farm-title">
        <SectionTitle
          id="farm-title"
          kicker="Step 2 (optional)"
          title="Your farm details"
          lead="Real measurements always beat estimates: your soil test overrides SoilGrids, and your irrigation answer changes the water assessment."
        />
        <div className="farm-form">
          <fieldset>
            <legend>Area</legend>
            <div className="inline-fields">
              <label className="field-label">
                Farm area
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={areaValue}
                  onChange={(e) => setAreaValue(e.target.value)}
                  disabled={drawnHa != null}
                />
              </label>
              <label className="field-label">
                Unit
                <select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)} disabled={drawnHa != null}>
                  {Object.entries(AREA_UNITS).map(([k, u]) => (
                    <option key={k} value={k}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {area.note && <p className="muted-note">{area.note}</p>}
            {areaUnit.startsWith("bigha") && (
              <p className="muted-note">Bigha varies by state and even district — confirm your local measure.</p>
            )}
          </fieldset>
          <fieldset>
            <legend>Farming</legend>
            <label className="field-label">
              Irrigation
              <select value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
                <option value="unknown">Not specified</option>
                <option value="yes">Available (tube well / canal / other)</option>
                <option value="no">Rain-fed only</option>
              </select>
            </label>
            <label className="field-label">
              Season to plan
              <select value={season} onChange={(e) => setSeason(e.target.value)}>
                <option value="">Current season (auto)</option>
                {CROP_SEASONS.map((s) => (
                  <option key={s.id}>{s.id}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Previous crop (for rotation)
              <input value={previousCrop} onChange={(e) => setPreviousCrop(e.target.value)} placeholder="e.g. Rice" />
            </label>
          </fieldset>
          <fieldset>
            <legend>Soil Health Card / lab test</legend>
            <div className="soil-inputs">
              {SOIL_FIELDS.map(([k, label, unit]) => (
                <label key={k} className="field-label">
                  {label}
                  {unit && <small> ({unit})</small>}
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={soilCard[k] ?? ""}
                    onChange={(e) => setSoilCard((c) => ({ ...c, [k]: e.target.value }))}
                  />
                </label>
              ))}
              <label className="field-label">
                Sample date
                <input
                  type="date"
                  value={soilCard.sampleDate ?? ""}
                  onChange={(e) => setSoilCard((c) => ({ ...c, sampleDate: e.target.value }))}
                />
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      {/* ------------------------------------------------ actions */}
      <section className="site-section" aria-labelledby="act-title">
        <SectionTitle
          id="act-title"
          kicker="Step 3"
          title="Run the analysis"
          lead={point ? `Location: ${point[0].toFixed(5)}, ${point[1].toFixed(5)}` : "No location selected yet."}
        />
        <div className="action-grid">
          <ActionButton
            icon={MapPinned}
            label="Fetch Local Agricultural Data"
            onClick={() => fetchLocal("fetch")}
            state={st.fetch}
          />
          <ActionButton icon={BarChart3} label="Analyze My Area" onClick={analyze} state={st.analyze} primary />
          <ActionButton icon={Database} label="Compare My Dataset" onClick={() => runCompare()} state={st.compare} />
          <ActionButton icon={ShieldCheck} label="Check Data Accuracy" onClick={runQuality} state={st.quality} />
          <ActionButton icon={Sprout} label="Predict Best Crops" onClick={() => runCrops()} state={st.crops} />
          <div className="action-cell">
            <div className="inline-fields">
              <select
                aria-label="Crop for yield prediction"
                value={yieldCrop}
                onChange={(e) => setYieldCrop(e.target.value)}
              >
                {YIELD_CROPS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                className="site-btn site-btn--light action-btn"
                onClick={runYield}
                disabled={st.yield?.status === "loading"}
              >
                <TrendingUp size={18} aria-hidden="true" /> Predict Crop Yield
              </button>
            </div>
            <StatusLine s={st.yield} />
          </div>
          <ActionButton
            icon={FileText}
            label="Generate Agricultural Report"
            onClick={generateReport}
            state={st.report}
          />
          <div className="action-cell">
            <div className="inline-fields">
              <button type="button" className="site-btn site-btn--light action-btn" onClick={downloadCsv}>
                <Download size={18} aria-hidden="true" /> Download CSV
              </button>
              <button type="button" className="site-btn site-btn--light action-btn" onClick={printPdf}>
                <Printer size={18} aria-hidden="true" /> Save as PDF
              </button>
            </div>
            <StatusLine s={st.download} />
          </div>
        </div>
        <details className="dataset-config">
          <summary>Dataset and matching settings</summary>
          <div className="farm-form">
            <fieldset>
              <legend>Dataset to compare</legend>
              <label className="field-label">
                Dataset
                <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
                  {Object.values(BUILTIN_DATASETS).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                  {upload && <option value="upload">Uploaded: {upload.meta.label}</option>}
                </select>
              </label>
              <label className="field-label">
                Or upload your CSV
                <input type="file" accept=".csv,text/csv" onChange={onUpload} />
              </label>
              <StatusLine s={st.upload} />
              <label className="field-label">
                Only records for crop (optional)
                <input value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} placeholder="e.g. Wheat" />
              </label>
            </fieldset>
            <fieldset>
              <legend>Parameter weights</legend>
              <div className="soil-inputs">
                {Object.keys(DEFAULT_WEIGHTS).map((k) => (
                  <label key={k} className="field-label">
                    {PARAM_LABELS[k]}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weights[k]}
                      onChange={(e) => setWeights((w) => ({ ...w, [k]: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="site-btn site-btn--sm site-btn--light"
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
              >
                Reset weights
              </button>
            </fieldset>
          </div>
        </details>
        <p className="muted-note">
          Engine:{" "}
          {backendStatus() === true
            ? "AgriSmart API (FastAPI)"
            : backendStatus() === false
              ? "browser — calling public APIs directly (no AgriSmart API on this deployment)"
              : "decided on first request"}
          .
        </p>
      </section>

      {/* ------------------------------------------------ results */}
      <div ref={resultsRef} id="report" className={`intel-results${reportReady ? " report-ready" : ""}`}>
        {local && (
          <>
            <section className="site-section result-section" aria-labelledby="res-a">
              <h2 id="res-a">A. Selected location</h2>
              <LocationPanel local={local} />
            </section>
            <section className="site-section result-section" aria-labelledby="res-b">
              <h2 id="res-b">B. Local climate</h2>
              <ClimatePanel local={local} />
            </section>
            <section className="site-section result-section" aria-labelledby="res-c">
              <h2 id="res-c">C. Local soil</h2>
              <SoilPanel local={local} />
            </section>
            <section className="site-section result-section" aria-labelledby="res-d">
              <h2 id="res-d">D. Agriculture</h2>
              <AgriculturePanel local={local} />
            </section>
          </>
        )}
        {(comparison || quality) && (
          <section className="site-section result-section" aria-labelledby="res-e">
            <h2 id="res-e">E. Dataset comparison</h2>
            <ComparisonPanel result={comparison} quality={quality} />
            {quality && <QualityPanel quality={quality} />}
          </section>
        )}
        {(suitability || yieldResult) && (
          <section className="site-section result-section" aria-labelledby="res-f">
            <h2 id="res-f">F. AI prediction</h2>
            <CropsPanel suitability={suitability} />
            {yieldResult && (
              <>
                <h3>Yield and production</h3>
                <YieldPanel result={yieldResult} />
              </>
            )}
          </section>
        )}
        {suggestions && (
          <section className="site-section result-section" aria-labelledby="res-s">
            <h2 id="res-s">Suggestions</h2>
            <div className="decision-grid">
              <div>
                <h4>Rule-based (published thresholds and guidance)</h4>
                <ul className="suggest-list">
                  {suggestions.verified.map((s, i) => (
                    <li key={i}>
                      <b>{s.topic}:</b> {s.text} <small>— {s.basis}</small> {s.link && <Link to={s.link}>Open</Link>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Model-generated (AgriSmart engines)</h4>
                {suggestions.generated.length ? (
                  <ul className="suggest-list">
                    {suggestions.generated.map((s, i) => (
                      <li key={i}>
                        <b>{s.topic}:</b> {s.text} <small>— {s.basis}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted-note">Run Predict Best Crops for model suggestions.</p>
                )}
              </div>
            </div>
          </section>
        )}
        {local && (
          <section className="site-section result-section" aria-labelledby="res-g">
            <h2 id="res-g">G. Final decision</h2>
            <DecisionPanel local={local} comparison={comparison} suitability={suitability} />
            <p className="medical-disclaimer">
              Planning aid only. Confirm decisions with a soil test, your Krishi Vigyan Kendra or state agriculture
              department. Analysed {new Date(local.analyzedAt).toLocaleString("en-IN")}.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
