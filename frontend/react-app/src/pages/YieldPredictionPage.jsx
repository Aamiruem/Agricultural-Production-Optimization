import { useMutation } from "@tanstack/react-query";
import { BrainCircuit, CloudRain, Search, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { G } from "@/lib/icons";
import { PageHeader } from "@/components/common/PageHeader";
import analytics from "@/data/generated/analytics.json";
import metrics from "@/data/generated/modelMetrics.json";
import { useT } from "@/i18n/useT";
import { YIELD_DOMAIN, rainfallSensitivity, seasonsFor } from "@/lib/agriModels";
import { useChartColors } from "@/lib/chartTheme";
import { getErrorMessage } from "@/services/apiClient";
import { predictYield } from "@/services/mlService";

// Visual identity for the dataset's crop names.
const CROP_EMOJI = {
  Rice: "🌾", Wheat: "🌾", Maize: "🌽", Bajra: "🌾", Jowar: "🌾", Ragi: "🌾", Barley: "🌾", "Small millets": "🌾", "Other Cereals": "🌾",
  Gram: "🫘", "Arhar/Tur": "🫘", "Moong(Green Gram)": "🫛", Urad: "🫘", Masoor: "🫘", "Cowpea(Lobia)": "🫛", "Horse-gram": "🫘", Moth: "🫘", Khesari: "🫘", "Peas & beans (Pulses)": "🫛",
  Groundnut: "🥜", "Rapeseed &Mustard": "🌼", Soyabean: "🫘", Sunflower: "🌻", Sesamum: "🌱", Safflower: "🌼", "Castor seed": "🌱", Linseed: "🌱", "Niger seed": "🌼",
  Banana: "🍌", Coconut: "🥥", Potato: "🥔", Onion: "🧅", "Sweet potato": "🍠", Tapioca: "🍠", Garlic: "🧄", Ginger: "🫚", Turmeric: "🟡", "Dry chillies": "🌶️",
  "Black pepper": "⚫", Cardamom: "🌿", Coriander: "🌿", Cashewnut: "🌰", Arecanut: "🌴", Sugarcane: "🎋", "Cotton(lint)": "☁️", Jute: "🧵", Mesta: "🧵", Sannhamp: "🧵", Tobacco: "🍂", "Guar seed": "🫘",
};
const emojiFor = (crop) => CROP_EMOJI[crop] ?? "🌱";
const ACRE_TO_HA = 0.404686;

export default function YieldPredictionPage() {
  const { t, lang } = useT();
  const c = useChartColors();
  const [crop, setCrop] = useState("Wheat");
  const [state, setState] = useState("Madhya Pradesh");
  const [season, setSeason] = useState("Rabi");
  const [year, setYear] = useState(new Date().getFullYear());
  const [acres, setAcres] = useState(5);
  const [rain, setRain] = useState("");
  const [cropQuery, setCropQuery] = useState("");
  const prediction = useMutation({ mutationFn: predictYield });

  const statesForCrop = useMemo(() => YIELD_DOMAIN.states.filter((s) => seasonsFor(s, crop).length), [crop]);
  const seasonOptions = seasonsFor(state, crop);
  const pickCrop = (next) => {
    setCrop(next);
    const states = YIELD_DOMAIN.states.filter((s) => seasonsFor(s, next).length);
    const nextState = states.includes(state) ? state : states[0];
    setState(nextState);
    const ss = seasonsFor(nextState, next);
    if (!ss.includes(season)) setSeason(ss[0]);
    prediction.reset();
  };
  const pickState = (next) => {
    setState(next);
    const ss = seasonsFor(next, crop);
    if (!ss.includes(season)) setSeason(ss[0]);
    prediction.reset();
  };
  const payload = { crop, season, state, year: Number(year), area_ha: Number(acres) * ACRE_TO_HA, ...(rain === "" ? {} : { annual_rainfall: Number(rain) }) };
  const result = prediction.data;

  const sensitivity = useMemo(() => {
    try { return rainfallSensitivity(payload); } catch { return []; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, state, season, year]);
  const national = (analytics.national[crop] || []).map(([yr, y]) => ({ year: yr, yield: y }));
  const crops = YIELD_DOMAIN.crops.filter((x) => x.toLowerCase().includes(cropQuery.toLowerCase()));
  const compare = result ? [
    ...(result.history ? [{ k: "Historical P25", v: result.history.p25, f: "#9aa8a0" }, { k: "Historical median", v: result.history.median, f: "#6f8277" }] : []),
    { k: "AI prediction", v: result.yield_t_ha, f: c.primary },
    ...(result.history ? [{ k: "Historical P75", v: result.history.p75, f: "#9aa8a0" }] : []),
  ] : [];

  return (
    <>
      <PageHeader page="yield" icon="trending_up" color={G.blue} />
      <div className="model-banner">
        <BrainCircuit size={18} />
        <span><b>Server: XGBoost</b> (R² {metrics.server_yield.r2_log.toFixed(2)} log-yield) · <b>Browser fallback</b>: log-linear trend + rainfall model (R² {metrics.yield.r2_log.toFixed(2)}, median error {(metrics.yield.median_ape * 100).toFixed(0)}%) — both validated on unseen 2015–2020 seasons. No model is 100% accurate; use the range, not just the point.</span>
      </div>

      <section className="tool-card">
        <div className="card-head"><h2>1. {lang === "hi" ? "फसल चुनें" : "Choose a crop"}</h2>
          <label className="search-input"><Search size={16} /><input placeholder={t("common.search")} value={cropQuery} onChange={(e) => setCropQuery(e.target.value)} aria-label="Search crops" /></label>
        </div>
        <div className="crop-picker" role="listbox" aria-label="Crop">
          {crops.map((x) => (
            <button key={x} type="button" role="option" aria-selected={crop === x} className={crop === x ? "on" : ""} onClick={() => pickCrop(x)}>
              <span className="crop-pic">{emojiFor(x)}</span><span>{x}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="yield-layout">
        <section className="tool-card">
          <h2>2. {lang === "hi" ? "खेत का विवरण" : "Field details"}</h2>
          <label className="field-label"><span>{t("common.state")}</span>
            <select value={state} onChange={(e) => pickState(e.target.value)}>{statesForCrop.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="field-label"><span>{t("common.season")}</span>
            <select value={season} onChange={(e) => { setSeason(e.target.value); prediction.reset(); }}>{seasonOptions.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <div className="two-col">
            <label className="field-label"><span>{t("common.year")}</span><input type="number" min="1997" max="2100" value={year} onChange={(e) => setYear(e.target.value)} /></label>
            <label className="field-label"><span>{t("common.area")} ({t("common.acres")})</span><input type="number" min="0.1" step="0.1" value={acres} onChange={(e) => setAcres(Math.max(0.1, Number(e.target.value) || 0.1))} /></label>
          </div>
          <label className="field-label"><span><CloudRain size={15} /> Annual rainfall (mm) <em>optional</em></span><input type="number" min="0" max="20000" placeholder={sensitivity[4] ? `Typical: ${sensitivity[4].rain} mm` : ""} value={rain} onChange={(e) => setRain(e.target.value)} /></label>
          <button className="btn btn-cta w-100 mt-2" disabled={prediction.isPending || !season} onClick={() => prediction.mutate(payload)}>
            <Sparkles size={17} /> {prediction.isPending ? t("common.loading") : lang === "hi" ? "उपज का अनुमान लगाएँ" : "Predict yield"}
          </button>
          {prediction.isError && <p className="text-danger mt-3" role="alert">{getErrorMessage(prediction.error)}</p>}
        </section>

        <section className="tool-card">
          <div className="card-head"><h2>3. {lang === "hi" ? "AI परिणाम" : "AI result"}</h2>{result && <span className="engine-chip">{result.engine === "browser" ? t("common.browserModel") : t("common.serverModel")} · {result.model}</span>}</div>
          {!result ? (
            <div className="empty-panel"><span className="crop-pic xl">{emojiFor(crop)}</span><b>{crop} · {state} · {season}</b><span>Run the prediction to see yield, production and how it compares with history.</span></div>
          ) : (
            <>
              <div className="result-tiles">
                <div className="rt green"><small>Predicted yield</small><b>{result.yield_t_ha} <em>t/ha</em></b>{result.low_t_ha && <span>Range {result.low_t_ha}–{result.high_t_ha}</span>}</div>
                <div className="rt blue"><small>Field production</small><b>{result.production_t} <em>t</em></b><span>{acres} acres ({(acres * ACRE_TO_HA).toFixed(2)} ha)</span></div>
                <div className="rt amber"><small>Per acre</small><b>{(result.yield_t_ha * ACRE_TO_HA * 10).toFixed(1)} <em>quintal</em></b><span>{(result.yield_t_ha * 10).toFixed(1)} q/ha</span></div>
              </div>
              {compare.length > 1 && <>
                <h3 className="chart-title">Prediction vs historical range (t/ha)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={compare} margin={{ top: 16, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={c.grid} vertical={false} />
                    <XAxis dataKey="k" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" t/ha" />} />
                    <Bar dataKey="v" name="Yield" radius={[4, 4, 0, 0]} maxBarSize={56} label={{ position: "top", fill: c.text, fontSize: 11 }}>{compare.map((d) => <Cell key={d.k} fill={d.f} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
                {result.history && <p className="muted small">Based on {result.history.n} historical seasons for {crop} in {state} ({season}).</p>}
              </>}
            </>
          )}
        </section>
      </div>

      <div className="tool-columns">
        <section className="tool-card">
          <h2>Rainfall sensitivity</h2>
          <p className="muted">How the predicted {crop} yield in {state} responds to annual rainfall (browser model).</p>
          {sensitivity.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sensitivity} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="rain" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} unit=" mm" />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} domain={["auto", "auto"]} />
                <Tooltip content={<ChartTooltip unit=" t/ha" labelPrefix="Rainfall " />} />
                <ReferenceLine x={sensitivity[4].rain} stroke={c.axis} strokeDasharray="4 4" label={{ value: "typical", fill: c.axis, fontSize: 11, position: "top" }} />
                <Line type="monotone" dataKey="yield" name="Predicted yield" stroke={c.series[0]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="muted">No data.</p>}
        </section>
        <section className="tool-card">
          <h2>National yield trend · {crop}</h2>
          <p className="muted">All-India weighted yield (t/ha), 1997–2020 dataset.</p>
          {national.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={national} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="year" stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} domain={["auto", "auto"]} />
                <Tooltip content={<ChartTooltip unit=" t/ha" />} />
                <Line type="monotone" dataKey="yield" name="India yield" stroke={c.series[2]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="muted">No national series for this crop.</p>}
        </section>
      </div>
      <p className="disclaimer">Predictions use crop, state, season, year, area and rainfall patterns from historical records. They do not know your variety, soil test, irrigation, pests or management, and years after 2020 are extrapolations. Confirm plans with your local KVK.</p>
    </>
  );
}
