import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { MIcon } from "@/components/common/MIcon";
import analytics from "@/data/generated/analytics.json";
import metrics from "@/data/generated/modelMetrics.json";
import { CROPS, SEASONS, STATES, STATE_BY_NAME } from "@/data/indiaAgri";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWeather, weatherLabel } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { useChartColors } from "@/lib/chartTheme";

// The AI tools, in the order a farmer meets them.
const TOOLS = [
  {
    to: "/crop-recommendation",
    icon: "potted_plant",
    key: "side.cropAdvisor",
    en: "Best crop for your N-P-K, pH, temperature, humidity and rainfall — with the reasons.",
    hi: "आपकी मिट्टी और जलवायु के लिए सर्वोत्तम फसल — कारणों सहित।",
  },
  {
    to: "/yield-prediction",
    icon: "trending_up",
    key: "side.yield",
    en: "Expected t/ha and total production, with the historical range for your state.",
    hi: "राज्य की ऐतिहासिक सीमा सहित अपेक्षित उपज और कुल उत्पादन।",
  },
  {
    to: "/soil-analysis",
    icon: "science",
    key: "side.soilHealth",
    en: "Soil Health Card scoring with clear fixes for every nutrient.",
    hi: "हर पोषक तत्व के सुधार सहित मृदा स्वास्थ्य कार्ड स्कोर।",
  },
  {
    to: "/disease-detection",
    icon: "pest_control",
    key: "side.disease",
    en: "Leaf-photo screening and a region-wise library of diseases and pests.",
    hi: "पत्ती की फ़ोटो जाँच और क्षेत्र-वार रोग व कीट पुस्तकालय।",
  },
  {
    to: "/fertilizer",
    icon: "compost",
    key: "side.fertilizer",
    en: "DAP, urea and MOP doses that close your exact nutrient gap.",
    hi: "पोषक तत्व की कमी के अनुसार DAP, यूरिया और MOP की मात्रा।",
  },
  {
    to: "/irrigation-optimization",
    icon: "water_drop",
    key: "side.irrigation",
    en: "FAO-56 water budget from live evapotranspiration — water only when needed.",
    hi: "लाइव वाष्पोत्सर्जन से FAO-56 जल बजट — ज़रूरत पर ही सिंचाई।",
  },
];

const STEPS = ["how1", "how2", "how3", "how4"];

const LEARN = [
  {
    to: "/learn#seasons",
    image: "/images/kharif-season.webp",
    tag: { en: "Seasons", hi: "मौसम" },
    title: { en: "Kharif, Rabi and Zaid at a glance", hi: "खरीफ, रबी और ज़ायद एक नज़र में" },
  },
  {
    to: "/disease-detection",
    image: "/images/crops/rice.webp",
    tag: { en: "Crop health", hi: "फसल स्वास्थ्य" },
    title: { en: "Diseases and pests by state and season", hi: "राज्य और मौसम अनुसार रोग और कीट" },
  },
  {
    to: "/learn#nutrients",
    image: "/images/rabi-season.webp",
    tag: { en: "Soil", hi: "मिट्टी" },
    title: { en: "Eight soil nutrients and their deficiency signs", hi: "आठ मृदा पोषक तत्व और कमी के लक्षण" },
  },
  {
    to: "/crop-gallery",
    image: "/images/zaid-horticulture.webp",
    tag: { en: "Crops", hi: "फसलें" },
    title: { en: "Photo guide to 45 Indian crops", hi: "45 भारतीय फसलों की चित्र मार्गदर्शिका" },
  },
];

// Real data sources and technology behind the app (not endorsements).
const BUILT_WITH = ["Open-Meteo", "data.gov.in", "scikit-learn", "XGBoost", "SHAP", "FastAPI", "React", "MCP"];

const FAQ = [
  [
    "How accurate are the AI predictions?",
    "कितने सटीक हैं AI पूर्वानुमान?",
    `No model is 100% accurate. On held-out data the crop recommender scores ${(metrics.recommend.test_accuracy * 100).toFixed(1)}% accuracy; the yield model explains about ${Math.round(metrics.yield.r2_log * 100)}% of yield variation (log scale) with a median error of ${Math.round(metrics.yield.median_ape * 100)}% on unseen 2015–2020 seasons. We always show a range.`,
    `कोई भी मॉडल 100% सटीक नहीं होता। परीक्षण डेटा पर फसल सुझाव ${(metrics.recommend.test_accuracy * 100).toFixed(1)}% सटीक है; उपज मॉडल की औसत त्रुटि लगभग ${Math.round(metrics.yield.median_ape * 100)}% है। हम हमेशा एक सीमा दिखाते हैं।`,
  ],
  [
    "Which states and crops are covered?",
    "कौन से राज्य और फसलें शामिल हैं?",
    `All 28 states and 8 union territories, with ${CROPS.length} crops across grains, pulses, oilseeds, fruits, vegetables, dry fruits, spices and plantation crops.`,
    `सभी 28 राज्य और 8 केंद्र शासित प्रदेश, ${CROPS.length} फसलों के साथ।`,
  ],
  [
    "Do I need an account?",
    "क्या खाता ज़रूरी है?",
    "No. All tools work without signing in. An account lets you save farms, fields and prediction history.",
    "नहीं। सभी टूल बिना लॉगिन चलते हैं। खाते से आप खेत और इतिहास सहेज सकते हैं।",
  ],
  [
    "Where does the weather data come from?",
    "मौसम डेटा कहाँ से आता है?",
    "Live forecasts from the Open-Meteo API (blending ECMWF, GFS and other national models). For official warnings follow IMD.",
    "Open-Meteo API से लाइव पूर्वानुमान। आधिकारिक चेतावनियों के लिए IMD देखें।",
  ],
  [
    "Can it replace a soil test or my KVK?",
    "क्या यह मिट्टी परीक्षण या KVK की जगह ले सकता है?",
    "No. AgriSmart is a planning aid. Use a recent Soil Health Card and confirm treatments with your Krishi Vigyan Kendra.",
    "नहीं। यह योजना का साधन है। मृदा स्वास्थ्य कार्ड और KVK से पुष्टि करें।",
  ],
];

function SectionHead({ kicker, title, lead, align = "center" }) {
  return (
    <div className={`lp-head lp-head--${align}`}>
      {kicker && <span className="lp-kicker">{kicker}</span>}
      <h2>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  );
}

/** Landing page: what AgriSmart does, how it works, real results and where to start. */
export default function HomePage() {
  const { t, lang } = useT();
  const hi = lang === "hi";
  const reduce = useReducedMotion();
  useDocumentTitle(
    null,
    "AgriSmart: AI crop recommendation, yield prediction, soil analysis, live weather, fertilizer and irrigation advice for every Indian state — in English and Hindi.",
  );
  const rise = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay },
  });
  const c = useChartColors();
  const punjab = analytics.states.Punjab.years.map(([year, area, production]) => ({ year, production, area }));
  const pie = analytics.states.Punjab.top.slice(0, 4).map(([name, value]) => ({ name, value }));
  const delhi = STATE_BY_NAME.Delhi;
  const w = useWeather(delhi);

  const STATS = [
    {
      value: `${(metrics.recommend.test_accuracy * 100).toFixed(1)}%`,
      label: hi ? "फसल मॉडल सटीकता" : "Crop-model accuracy",
    },
    { value: metrics.yield.r2_log.toFixed(2), label: hi ? "उपज मॉडल R² (log)" : "Yield-model R² (log)" },
    { value: CROPS.length, label: hi ? "फसलें शामिल" : "Crops covered" },
    { value: STATES.length, label: hi ? "राज्य और UT" : "States & UTs" },
  ];

  return (
    <div className="home landing">
      {/* Hero */}
      <section className="lp-hero">
        <img
          className="lp-hero-photo"
          src="/images/india-agriculture-hero.webp"
          alt=""
          width="1600"
          height="900"
          fetchpriority="high"
        />
        <div className="lp-hero-content">
          <motion.span className="lp-pill" {...rise()}>
            <MIcon name="auto_awesome" size={16} fill /> {t("home.eyebrow")}
          </motion.span>
          <motion.h1 {...rise(0.05)}>
            {t("home.title1")} <em>{t("home.title2")}</em> {t("home.title3")}
          </motion.h1>
          <motion.p {...rise(0.1)}>{t("home.lead")}</motion.p>
          <motion.div className="lp-actions" {...rise(0.15)}>
            <Link to="/crop-recommendation" className="lp-btn lp-btn--light">
              {hi ? "फसल सलाह लें" : "Get crop advice"} <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="lp-btn lp-btn--ghost">
              {t("home.ctaSecondary")}
            </Link>
          </motion.div>
        </div>
        <ul className="lp-hero-chips" aria-label={hi ? "मुख्य बातें" : "Highlights"}>
          <li>
            <MIcon name="verified_user" size={16} fill /> {hi ? "मुफ़्त और सुरक्षित" : "Free & private"}
          </li>
          <li>
            <MIcon name="map" size={16} fill /> {hi ? "36 राज्य/UT" : "36 states & UTs"}
          </li>
          <li>
            <MIcon name="translate" size={16} fill /> English + हिंदी
          </li>
        </ul>
        <Link to="/learn" className="lp-hero-card">
          <img src="/images/farm-illustration.webp" alt="" width="72" height="72" />
          <span>
            <b>{hi ? "ज्ञान केंद्र" : "Explore the Knowledge hub"}</b>
            <small>{hi ? "मौसम, पोषक तत्व, सूत्र" : "Seasons, nutrients, formulas"}</small>
          </span>
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* About + tools */}
      <section className="lp-section" id="about">
        <SectionHead
          kicker={t("nav.about")}
          title={hi ? "मिट्टी से बाज़ार तक, डेटा-आधारित खेती" : "Data-driven farming, from soil to harvest"}
          lead={t("home.aboutText")}
        />
        <div className="lp-cards" id="solutions">
          {TOOLS.map((tool, i) => (
            <motion.div key={tool.to} {...rise(i * 0.04)}>
              <Link to={tool.to} className="lp-card">
                <span className="lp-icon">
                  <MIcon name={tool.icon} size={24} fill />
                </span>
                <h3>{t(tool.key)}</h3>
                <p>{hi ? tool.hi : tool.en}</p>
                <span className="lp-chip">
                  {hi ? "टूल खोलें" : "Open tool"} <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section lp-split" id="how-it-works">
        <motion.div className="lp-split-text" {...rise()}>
          <span className="lp-kicker">{t("nav.how")}</span>
          <h2>{hi ? "आसान प्रक्रिया, मापने योग्य परिणाम।" : "Simple process. Measurable results."}</h2>
          <ol className="lp-steps">
            {STEPS.map((k, i) => (
              <li key={k}>
                <span>{i + 1}</span>
                <div>
                  <b>{t(`home.${k}`)}</b>
                  <small>{t(`home.${k}t`)}</small>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/crop-recommendation" className="lp-btn lp-btn--dark">
            {hi ? "अभी शुरू करें" : "Start now"} <ArrowRight size={18} />
          </Link>
        </motion.div>
        <motion.figure className="lp-split-media" {...rise(0.1)}>
          <img
            src="/images/farm-illustration.webp"
            alt={hi ? "सब्ज़ी और फूलों की क्यारियों वाला खेत" : "A diversified farm with vegetable beds and greenhouses"}
            width="590"
            height="590"
            loading="lazy"
          />
          <figcaption>
            <MIcon name="eco" size={18} fill /> {hi ? "विविध खेती, बेहतर आय" : "Diversify crops, steady income"}
          </figcaption>
        </motion.figure>
      </section>

      {/* Results */}
      <section className="lp-section">
        <SectionHead title={hi ? "हमारे मॉडल के परिणाम" : "Results you can check"} />
        <div className="lp-stats">
          {STATS.map((s, i) => (
            <motion.div key={s.label} className={i === 0 ? "is-featured" : undefined} {...rise(i * 0.05)}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </motion.div>
          ))}
        </div>
        <p className="lp-note">
          {hi
            ? "मॉडल मीट्रिक परीक्षण डेटा पर मापे गए हैं — मॉडल इनसाइट्स में पूरा विवरण देखें।"
            : "Model metrics are measured on held-out test data — see Model insights for the full leaderboard."}{" "}
          <Link to="/insights" className="text-link">
            {t("side.modelInsights")} <ArrowRight size={14} />
          </Link>
        </p>
      </section>

      {/* Mission */}
      <section className="lp-mission">
        <img src="/images/rabi-season.webp" alt="" loading="lazy" width="1200" height="800" />
        <div>
          <span className="lp-kicker">{t("home.mission")}</span>
          <p>{t("home.missionText")}</p>
        </div>
      </section>

      {/* Live data preview */}
      <section className="lp-section" aria-labelledby="preview-title">
        <SectionHead title={t("home.previewTitle")} lead={t("home.previewLead")} />
        <div className="preview-frame">
          <div className="g-card span-8">
            <div className="card-head2">
              <div>
                <h3>Punjab · {hi ? "उत्पादन" : "production"} (t)</h3>
                <p>1997–2020</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={punjab} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.primary} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={c.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="production" stroke={c.primary} strokeWidth={2} fill="url(#pv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="g-card span-4">
            <div className="card-head2">
              <div>
                <h3>{hi ? "फसल वितरण" : "Crop distribution"}</h3>
                <p>{hi ? "क्षेत्रफल" : "by area"}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={pie}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={1.5}
                  stroke={c.surface}
                  strokeWidth={2}
                >
                  {pie.map((p, i) => (
                    <Cell key={p.name} fill={c.series[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="legend-list compact">
              {pie.map((p, i) => (
                <li key={p.name}>
                  <i style={{ background: c.series[i] }} />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center mt-4">
          <Link to="/dashboard" className="lp-btn lp-btn--dark">
            {t("home.ctaSecondary")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Learn */}
      <section className="lp-section">
        <SectionHead kicker={hi ? "सीखें" : "Learn"} title={hi ? "सीखें और खोजें" : "Learn & explore"} />
        <div className="lp-articles">
          {LEARN.map((a, i) => (
            <motion.div key={a.to} {...rise(i * 0.05)}>
              <Link to={a.to} className="lp-article">
                <img src={a.image} alt="" loading="lazy" width="480" height="300" />
                <span className="lp-tag">{hi ? a.tag.hi : a.tag.en}</span>
                <h3>{hi ? a.title.hi : a.title.en}</h3>
                <span className="lp-chip">
                  {hi ? "पढ़ें" : "Read more"} <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Built with */}
      <section className="lp-built" aria-label={hi ? "डेटा और तकनीक" : "Data and technology"}>
        <span>{hi ? "खुले डेटा और भरोसेमंद तकनीक पर आधारित" : "Built on open data and proven technology"}</span>
        <ul>
          {BUILT_WITH.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>

      {/* Weather & seasons */}
      <section className="lp-section weather-insights">
        <SectionHead title={t("home.weatherTitle")} />
        <div className="wi-grid">
          <div className="wi-card live">
            <small>
              {t("common.live")} · {delhi.capital}
            </small>
            {w.data ? (
              <>
                <b>
                  {weatherLabel(w.data.current.weather_code).icon} {Math.round(w.data.current.temperature_2m)}°C
                </b>
                <span>
                  {weatherLabel(w.data.current.weather_code, lang).text} · 💧 {w.data.current.relative_humidity_2m}%
                </span>
              </>
            ) : (
              <b>—</b>
            )}
            <Link to="/weather" className="text-link">
              {hi ? "अपने राज्य का मौसम" : "Your state's weather"} <ArrowRight size={15} />
            </Link>
          </div>
          {SEASONS.map((s) => (
            <div key={s.id} className="wi-card" style={{ "--c": s.color }}>
              <small>
                {s.emoji} {hi ? s.monthsHi : s.months}
              </small>
              <b>{hi ? s.hi : s.en}</b>
              <span>{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section faq" id="faq">
        <SectionHead title={t("home.faqTitle")} />
        <div className="faq-list">
          {FAQ.map(([q, qh, a, ah]) => (
            <details key={q}>
              <summary>{hi ? qh : q}</summary>
              <p>{hi ? ah : a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="lp-cta">
        <h2>{hi ? "अपने खेत को बेहतर बनाने के लिए तैयार?" : "Ready to optimise your fields?"}</h2>
        <p>{t("home.ctaText")}</p>
        <div className="lp-actions">
          <Link to="/register" className="lp-btn lp-btn--dark">
            {t("home.ctaPrimary")} <ArrowRight size={18} />
          </Link>
          <Link to="/contact" className="lp-btn lp-btn--outline">
            {t("nav.contact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
