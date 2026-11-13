import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, BrainCircuit, ChartNoAxesCombined, CloudSun, Droplets, Eye, FlaskConical, Gauge, LayoutDashboard, Leaf,
  ScanLine, ShieldCheck, Sprout, Target, TrendingUp, WalletCards,
} from "lucide-react";
import { Link } from "react-router";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { IconBadge } from "@/components/common/IconBadge";
import analytics from "@/data/generated/analytics.json";
import metrics from "@/data/generated/modelMetrics.json";
import { CATEGORIES, CROPS, SEASONS, STATES, STATE_BY_NAME } from "@/data/indiaAgri";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWeather, weatherLabel } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { chartColors } from "@/lib/chartTheme";

const SOLUTIONS = [
  { to: "/crop-recommendation", icon: Sprout, color: "#22c55e", key: "side.recommend", en: "Best crop for your N-P-K, pH, temperature, humidity and rainfall.", hi: "आपकी मिट्टी और जलवायु के लिए सर्वोत्तम फसल।" },
  { to: "/yield-prediction", icon: TrendingUp, color: "#2563eb", key: "side.yield", en: "Predict t/ha and total production with historical ranges.", hi: "ऐतिहासिक सीमा सहित उपज और कुल उत्पादन का अनुमान।" },
  { to: "/soil-analysis", icon: FlaskConical, color: "#a16207", key: "side.soil", en: "Soil Health Card scoring with radar charts and fixes.", hi: "रडार चार्ट और सुधार सहित मृदा स्वास्थ्य स्कोर।" },
  { to: "/disease-detection", icon: ScanLine, color: "#e11d48", key: "side.disease", en: "Leaf-photo screening plus a symptom matcher.", hi: "पत्ती की फ़ोटो जाँच और लक्षण मिलान।" },
  { to: "/fertilizer", icon: WalletCards, color: "#d97706", key: "side.fertilizer", en: "DAP, Urea and MOP doses for your exact nutrient gap.", hi: "पोषक तत्व की कमी के अनुसार DAP, यूरिया, MOP।" },
  { to: "/irrigation-optimization", icon: Droplets, color: "#0284c7", key: "side.irrigation", en: "FAO-56 water budget from live evapotranspiration.", hi: "लाइव वाष्पोत्सर्जन से FAO-56 जल बजट।" },
];

const FEATURES = [
  { to: "/dashboard", icon: LayoutDashboard, color: "#16a34a", key: "side.dashboard" },
  { to: "/weather", icon: CloudSun, color: "#0ea5e9", key: "side.weather" },
  { to: "/reports", icon: ChartNoAxesCombined, color: "#7c3aed", key: "side.reports" },
  { to: "/states", icon: Target, color: "#0d9488", key: "side.states" },
];

const FAQ = [
  ["How accurate are the AI predictions?", "कितने सटीक हैं AI पूर्वानुमान?",
    `No model is 100% accurate. On held-out data the crop recommender scores ${(metrics.recommend.test_accuracy * 100).toFixed(1)}% accuracy; the yield model explains about ${Math.round(metrics.yield.r2_log * 100)}% of yield variation (log scale) with a median error of ${Math.round(metrics.yield.median_ape * 100)}% on unseen 2015–2020 seasons. We always show a range.`,
    `कोई भी मॉडल 100% सटीक नहीं होता। परीक्षण डेटा पर फसल सुझाव ${(metrics.recommend.test_accuracy * 100).toFixed(1)}% सटीक है; उपज मॉडल की औसत त्रुटि लगभग ${Math.round(metrics.yield.median_ape * 100)}% है। हम हमेशा एक सीमा दिखाते हैं।`],
  ["Which states and crops are covered?", "कौन से राज्य और फसलें शामिल हैं?",
    `All 28 states and 8 union territories, with ${CROPS.length} crops across grains, pulses, oilseeds, fruits, vegetables, dry fruits, spices and plantation crops.`,
    `सभी 28 राज्य और 8 केंद्र शासित प्रदेश, ${CROPS.length} फसलों के साथ।`],
  ["Do I need an account?", "क्या खाता ज़रूरी है?",
    "No. All tools work without signing in. An account lets you save farms, fields and prediction history.",
    "नहीं। सभी टूल बिना लॉगिन चलते हैं। खाते से आप खेत और इतिहास सहेज सकते हैं।"],
  ["Where does the weather data come from?", "मौसम डेटा कहाँ से आता है?",
    "Live forecasts from the Open-Meteo API (blending ECMWF, GFS and other national models). For official warnings follow IMD.",
    "Open-Meteo API से लाइव पूर्वानुमान। आधिकारिक चेतावनियों के लिए IMD देखें।"],
  ["Can it replace a soil test or my KVK?", "क्या यह मिट्टी परीक्षण या KVK की जगह ले सकता है?",
    "No. AgriSmart is a planning aid. Use a recent Soil Health Card and confirm treatments with your Krishi Vigyan Kendra.",
    "नहीं। यह योजना का साधन है। मृदा स्वास्थ्य कार्ड और KVK से पुष्टि करें।"],
];

export default function HomePage() {
  const { t, lang } = useT();
  const hi = lang === "hi";
  const reduce = useReducedMotion();
  useDocumentTitle(null, "AgriSmart: AI crop recommendation, yield prediction, soil analysis, live weather, fertilizer and irrigation advice for every Indian state — in English and Hindi.");
  const rise = (delay = 0) => ({ initial: reduce ? false : { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { duration: 0.5, delay } });
  const c = chartColors("dark");
  const punjab = analytics.states.Punjab.years.map(([year, area, production]) => ({ year, production, area }));
  const pie = analytics.states.Punjab.top.slice(0, 4).map(([name, value]) => ({ name, value }));
  const delhi = STATE_BY_NAME.Delhi;
  const w = useWeather(delhi);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero-x">
        <div className="hero-x-bg" aria-hidden="true" />
        <div className="hero-x-content">
          <motion.span className="eyebrow" {...rise()}><BrainCircuit size={15} /> {t("home.eyebrow")}</motion.span>
          <motion.h1 {...rise(0.05)}>{t("home.title1")} <em>{t("home.title2")}</em> <span>{t("home.title3")}</span></motion.h1>
          <motion.p {...rise(0.1)}>{t("home.lead")}</motion.p>
          <motion.div className="hero-ctas" {...rise(0.15)}>
            <Link to="/register" className="btn btn-cta btn-lg">{t("home.ctaPrimary")} <ArrowRight size={18} /></Link>
            <Link to="/dashboard" className="btn btn-glass btn-lg">{t("home.ctaSecondary")}</Link>
          </motion.div>
          <motion.div className="hero-badges" {...rise(0.2)}>
            <span><ShieldCheck size={15} /> {hi ? "मुफ़्त और सुरक्षित" : "Free & private"}</span>
            <span>🇮🇳 {hi ? "36 राज्य/UT" : "36 states & UTs"}</span>
            <span>अ/A {hi ? "हिंदी + English" : "English + हिंदी"}</span>
          </motion.div>
        </div>
        <div className="hero-x-visual" aria-hidden="true">
          <div className="float-card f1"><span>🌾</span><div><b>{hi ? "गेहूँ — 4.6 t/ha" : "Wheat — 4.6 t/ha"}</b><small>{hi ? "AI पूर्वानुमान" : "AI forecast · Punjab"}</small></div></div>
          <div className="float-card f2"><span>💧</span><div><b>−32%</b><small>{hi ? "ड्रिप से पानी बचत" : "water with drip"}</small></div></div>
          <div className="float-card f3"><span>🧪</span><div><b>N · P · K</b><small>{hi ? "मृदा स्वास्थ्य 78/100" : "Soil health 78/100"}</small></div></div>
          <div className="hero-orb">🌱</div>
        </div>
      </section>

      {/* Statistics */}
      <section className="stats-band" aria-label={t("home.statsTitle")}>
        {[
          [CROPS.length, t("home.stat1"), "#16a34a"],
          [STATES.length, t("home.stat2"), "#2563eb"],
          [analytics.rows.toLocaleString("en-IN"), t("home.stat3"), "#d97706"],
          [`${(metrics.recommend.test_accuracy * 100).toFixed(1)}%`, t("home.stat4"), "#7c3aed"],
        ].map(([v, l, col]) => <motion.div key={l} {...rise()} style={{ "--c": col }}><b>{v}</b><span>{l}</span></motion.div>)}
      </section>

      {/* About */}
      <section className="home-section about-split" id="about">
        <motion.div {...rise()}>
          <span className="section-kicker">{t("nav.about")}</span>
          <h2>{t("home.aboutTitle")}</h2>
          <p className="lead-text">{t("home.aboutText")}</p>
          <Link to="/about" className="text-link">{hi ? "और जानें" : "Learn more"} <ArrowRight size={16} /></Link>
        </motion.div>
        <div className="mv-cards">
          <motion.div className="mv-card" {...rise(0.05)}><IconBadge icon={Target} color="#16a34a" box={46} size={22} /><h3>{t("home.mission")}</h3><p>{t("home.missionText")}</p></motion.div>
          <motion.div className="mv-card" {...rise(0.1)}><IconBadge icon={Eye} color="#2563eb" box={46} size={22} /><h3>{t("home.vision")}</h3><p>{t("home.visionText")}</p></motion.div>
        </div>
      </section>

      {/* AI solutions */}
      <section className="home-section" id="solutions">
        <div className="section-head"><span className="section-kicker">{t("nav.solutions")}</span><h2>{t("home.solutionsTitle")}</h2><p>{t("home.solutionsLead")}</p></div>
        <div className="solution-grid">
          {SOLUTIONS.map((s, i) => (
            <motion.div key={s.to} {...rise(i * 0.04)}>
              <Link to={s.to} className="solution-card" style={{ "--c": s.color }}>
                <IconBadge icon={s.icon} color={s.color} box={52} size={25} />
                <h3>{t(s.key)}</h3><p>{hi ? s.hi : s.en}</p>
                <span className="text-link">{hi ? "खोलें" : "Open tool"} <ArrowRight size={15} /></span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-section" id="features">
        <div className="section-head"><span className="section-kicker">{t("nav.features")}</span><h2>{hi ? "और भी बहुत कुछ" : "Everything in one platform"}</h2></div>
        <div className="feature-row">{FEATURES.map((f) => <Link key={f.to} to={f.to} className="feature-pill"><IconBadge icon={f.icon} color={f.color} />{t(f.key)}</Link>)}</div>
      </section>

      {/* How it works */}
      <section className="home-section" id="how-it-works">
        <div className="section-head"><span className="section-kicker">{t("nav.how")}</span><h2>{t("home.howTitle")}</h2></div>
        <ol className="steps">
          {[["how1", Leaf, "#16a34a"], ["how2", BrainCircuit, "#7c3aed"], ["how3", Sprout, "#d97706"], ["how4", Gauge, "#2563eb"]].map(([k, Icon, col], i) => (
            <motion.li key={k} {...rise(i * 0.06)} style={{ "--c": col }}>
              <span className="step-num">{i + 1}</span><IconBadge icon={Icon} color={col} box={50} size={24} />
              <h3>{t(`home.${k}`)}</h3><p>{t(`home.${k}t`)}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Dashboard preview */}
      <section className="home-section preview" aria-labelledby="preview-title">
        <div className="section-head light"><h2 id="preview-title">{t("home.previewTitle")}</h2><p>{t("home.previewLead")}</p></div>
        <div className="preview-frame">
          <div className="glass span-8">
            <div className="glass-head"><div><h3>Punjab · {hi ? "उत्पादन" : "production"} (t)</h3><p>1997–2020</p></div></div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={punjab} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs><linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.primary} stopOpacity={0.5} /><stop offset="100%" stopColor={c.primary} stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="production" stroke={c.primary} strokeWidth={2} fill="url(#pv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass span-4">
            <div className="glass-head"><div><h3>{hi ? "फसल वितरण" : "Crop distribution"}</h3><p>{hi ? "क्षेत्रफल" : "by area"}</p></div></div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart><Pie data={pie} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={1.5} stroke={c.surface} strokeWidth={2}>{pie.map((p, i) => <Cell key={p.name} fill={c.series[i]} />)}</Pie></PieChart>
            </ResponsiveContainer>
            <ul className="legend-list compact">{pie.map((p, i) => <li key={p.name}><i style={{ background: c.series[i] }} />{p.name}</li>)}</ul>
          </div>
        </div>
        <div className="text-center mt-4"><Link to="/dashboard" className="btn btn-cta btn-lg">{t("home.ctaSecondary")} <ArrowRight size={18} /></Link></div>
      </section>

      {/* Benefits */}
      <section className="home-section">
        <div className="section-head"><h2>{t("home.benefitsTitle")}</h2></div>
        <div className="benefit-grid">
          {[["b1", Droplets, "#0284c7"], ["b2", BrainCircuit, "#7c3aed"], ["b3", WalletCards, "#d97706"], ["b4", ShieldCheck, "#16a34a"]].map(([k, Icon, col], i) => (
            <motion.div key={k} className="benefit-card" {...rise(i * 0.05)} style={{ "--c": col }}><IconBadge icon={Icon} color={col} box={48} size={23} /><h3>{t(`home.${k}`)}</h3><p>{t(`home.${k}t`)}</p></motion.div>
          ))}
        </div>
      </section>

      {/* Supported crops */}
      <section className="home-section">
        <div className="section-head"><h2>{t("home.cropsTitle")}</h2><p>{t("home.cropsLead")}</p></div>
        <div className="cat-cards">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} to={`/crops?category=${cat.id}`} className="cat-card" style={{ "--c": cat.color, "--bg": cat.bg }}>
              <span className="cat-emoji">{cat.emoji}</span>
              <b>{hi ? cat.hi : cat.en}</b>
              <small>{CROPS.filter((x) => x.category === cat.id).slice(0, 4).map((x) => (hi ? x.hi : x.en.split(" (")[0])).join(", ")}…</small>
              <em>{CROPS.filter((x) => x.category === cat.id).length} {hi ? "फसलें" : "crops"}</em>
            </Link>
          ))}
        </div>
      </section>

      {/* Weather & insights */}
      <section className="home-section weather-insights">
        <div className="section-head"><h2>{t("home.weatherTitle")}</h2></div>
        <div className="wi-grid">
          <div className="wi-card live">
            <small>{t("common.live")} · {delhi.capital}</small>
            {w.data ? <><b>{weatherLabel(w.data.current.weather_code).icon} {Math.round(w.data.current.temperature_2m)}°C</b><span>{weatherLabel(w.data.current.weather_code, lang).text} · 💧 {w.data.current.relative_humidity_2m}%</span></> : <b>—</b>}
            <Link to="/weather" className="text-link">{hi ? "अपने राज्य का मौसम" : "Your state's weather"} <ArrowRight size={15} /></Link>
          </div>
          {SEASONS.map((s) => <div key={s.id} className="wi-card" style={{ "--c": s.color }}><small>{s.emoji} {hi ? s.monthsHi : s.months}</small><b>{hi ? s.hi : s.en}</b><span>{s.note}</span></div>)}
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section faq" id="faq">
        <div className="section-head"><h2>{t("home.faqTitle")}</h2></div>
        <div className="faq-list">{FAQ.map(([q, qh, a, ah]) => <details key={q}><summary>{hi ? qh : q}</summary><p>{hi ? ah : a}</p></details>)}</div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>{t("home.ctaTitle")}</h2>
        <p>{t("home.ctaText")}</p>
        <div className="hero-ctas center"><Link to="/register" className="btn btn-light btn-lg">{t("home.ctaPrimary")} <ArrowRight size={18} /></Link><Link to="/contact" className="btn btn-glass btn-lg">{t("nav.contact")}</Link></div>
      </section>
    </div>
  );
}
