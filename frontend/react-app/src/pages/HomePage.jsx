import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  CloudSun,
  Crosshair,
  Database,
  Droplets,
  FlaskConical,
  Gauge,
  GraduationCap,
  Layers,
  Leaf,
  LineChart,
  MapPin,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Thermometer,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";

import metrics from "@/data/generated/modelMetrics.json";
import { photo } from "@/data/site";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useReveal } from "@/hooks/useReveal";
import { useSession } from "@/store/authStore";

const OVERVIEW = [
  {
    icon: Layers,
    title: "Smart Agriculture Intelligence",
    text: "Weather, climate, soil and crop statistics for your exact location, in one place.",
    to: "/features#location-analysis",
  },
  {
    icon: CloudSun,
    title: "Soil and Weather Analysis",
    text: "Live 7-day weather, ten years of rainfall history and soil properties with their sources.",
    to: "/features#soil",
  },
  {
    icon: Sprout,
    title: "AI Crop Recommendations",
    text: "The best crops for your season and soil, each with the reasons behind it.",
    to: "/ai-in-agriculture#crop-recommendation",
  },
  {
    icon: TrendingUp,
    title: "Crop Yield Prediction",
    text: "Expected yield and total production for your field, with a realistic range.",
    to: "/ai-in-agriculture#crop-yield-prediction",
  },
  {
    icon: BarChart3,
    title: "Agricultural Data Analytics",
    text: "Upload farm data, compare it with local conditions and check its quality.",
    to: "/features#matching",
  },
  {
    icon: Crosshair,
    title: "Precision Farming",
    text: "Field mapping, area calculation and input guidance based on measured data.",
    to: "/agricultural-production-systems/precision-agriculture",
  },
];

const KEY_FEATURES = [
  {
    icon: MapPin,
    title: "Location-based analysis",
    text: "GPS, village search or a drawn field boundary.",
    id: "location-analysis",
  },
  {
    icon: Layers,
    title: "India interactive map",
    text: "States, 727 districts, 5,966 tehsils and soil layers.",
    id: "india-map",
  },
  {
    icon: CloudSun,
    title: "Live weather insights",
    text: "Current conditions, 7-day forecast and farm alerts.",
    id: "weather",
  },
  {
    icon: CloudRain,
    title: "Rainfall and climate monitoring",
    text: "10-year normals and seasonal departure.",
    id: "climate",
  },
  {
    icon: FlaskConical,
    title: "Soil health intelligence",
    text: "Soil Health Card scoring and soil maps.",
    id: "soil",
  },
  { icon: Sprout, title: "Crop suitability analysis", text: "Top crops for the season, explained.", id: "suitability" },
  { icon: TrendingUp, title: "Yield and production prediction", text: "t/ha and tonnes for your area.", id: "yield" },
  {
    icon: Database,
    title: "Dataset matching and validation",
    text: "Transparent compatibility score.",
    id: "matching",
  },
  { icon: Target, title: "Farm area calculation", text: "Geodesic area in ha, acres or bigha.", id: "area" },
  {
    icon: Sparkles,
    title: "Agricultural recommendations",
    text: "Irrigation, soil and risk guidance.",
    id: "recommendations",
  },
  {
    icon: Wheat,
    title: "Agricultural machinery information",
    text: "12 smart machines explained.",
    id: "machinery",
    open: true,
  },
  { icon: LineChart, title: "Reports and data exports", text: "Fully sourced CSV and PDF.", id: "reports" },
];

const SOLUTIONS = [
  {
    title: "AI Crop Recommendation",
    input: "Soil N, P, K, pH, temperature, humidity, rainfall",
    process: "Classifier trained on crop requirement data, checked against season and soil constraints",
    output: "Ranked crops with reasons",
    use: "Choose what to sow",
  },
  {
    title: "Crop Yield Prediction",
    input: "Crop, season, state, area, rainfall",
    process: "Gradient-boosted regression on 1997–2020 state records",
    output: "Yield range and production",
    use: "Plan inputs, storage and sales",
  },
  {
    title: "Soil Intelligence",
    input: "Soil test or SoilGrids estimates",
    process: "Soil Health Card ratings and texture classification",
    output: "Nutrient status and fixes",
    use: "Fix deficiencies before sowing",
  },
  {
    title: "Weather-Based Risk Analysis",
    input: "7-day forecast and 10-year history",
    process: "IMD thresholds for heat, heavy rain and rainfall departure",
    output: "Plain-language alerts",
    use: "Time irrigation and spraying",
  },
  {
    title: "Agricultural Data Matching",
    input: "Your dataset and local data",
    process: "Weighted, tolerance-based comparison",
    output: "Compatibility score per parameter",
    use: "Know if your data fits your farm",
  },
  {
    title: "Production Forecasting",
    input: "Yield model and cultivated area",
    process: "Yield × area with historical range",
    output: "Expected tonnes",
    use: "Estimate harvest and income",
  },
];

const STEPS = [
  {
    title: "Select Your Location",
    text: "Choose your village, district or agricultural field — by GPS, search or the map.",
  },
  {
    title: "Collect Agricultural Data",
    text: "Retrieve available weather, soil, seasonal and crop information for that place.",
  },
  { title: "Analyze and Compare", text: "Compare your actual agricultural data with location-specific information." },
  {
    title: "Get Intelligent Suggestions",
    text: "View crop recommendations, production predictions and practical insights.",
  },
];

const PARAMS = [
  {
    icon: Thermometer,
    title: "Temperature",
    text: "Current, forecast and seasonal mean temperature.",
    src: "Open-Meteo · live",
  },
  {
    icon: CloudRain,
    title: "Rainfall",
    text: "Forecast rain, monthly normals and season departure.",
    src: "Open-Meteo / ERA5",
  },
  {
    icon: Droplets,
    title: "Humidity",
    text: "Relative humidity now and its long-term average.",
    src: "Open-Meteo / ERA5",
  },
  {
    icon: Layers,
    title: "Soil type",
    text: "Regional soil class and USDA texture at your point.",
    src: "SoilGrids · reference tables",
  },
  {
    icon: FlaskConical,
    title: "Soil nutrients",
    text: "N, P, K, pH, EC and organic carbon from your soil test.",
    src: "Your Soil Health Card",
  },
  {
    icon: CalendarDays,
    title: "Crop seasons",
    text: "Kharif, Rabi and Zaid windows for your location.",
    src: "Crop calendar",
  },
  {
    icon: Gauge,
    title: "Irrigation",
    text: "Crop water demand (ET₀) versus forecast rain.",
    src: "FAO-56 water balance",
  },
  {
    icon: Wheat,
    title: "Crop production",
    text: "Major crops, area and historical yields in your state.",
    src: "State statistics 1997–2020",
  },
];

const BENEFITS = [
  {
    icon: CheckCircle2,
    title: "Better-informed decisions",
    text: "See the data and the reasons behind every suggestion.",
  },
  { icon: MapPin, title: "Location-specific insights", text: "Analysis for your field, not a national average." },
  { icon: Sprout, title: "Data-driven crop planning", text: "Match crops to season, soil and water." },
  { icon: Leaf, title: "Understand soil and climate", text: "Clear soil ratings and 10 years of climate history." },
  { icon: Recycle, title: "Smarter resource management", text: "Water and fertilizer guidance based on measurements." },
  {
    icon: GraduationCap,
    title: "Knowledge in one place",
    text: "Guides to farming systems, machines, health and schemes.",
  },
  {
    icon: ShieldCheck,
    title: "Honest, easy analytics",
    text: "Every value shows its source; missing data is never guessed.",
  },
];

const FAQ = [
  [
    "Is AgriSmart free?",
    "Yes. Creating an account is free, and the knowledge pages are open to everyone without signing in.",
  ],
  [
    "Why do I need an account for the tools?",
    "Your farms, analyses and history are saved to your account, and the analysis services are protected so only signed-in users can run them.",
  ],
  [
    "How accurate are the predictions?",
    `No model is 100% accurate. The crop model scores ${(metrics.recommend.test_accuracy * 100).toFixed(1)}% on held-out test data; the yield model explains about ${Math.round(metrics.yield.r2_log * 100)}% of yield variation (log scale) on unseen 2015–2020 seasons. AgriSmart always shows ranges and data sources.`,
  ],
  [
    "Where does the data come from?",
    "Open-Meteo (weather and ERA5 climate history), ISRIC SoilGrids (soil estimates), OpenStreetMap (place names), India boundary data and state crop statistics. Your own soil test always takes priority.",
  ],
];

function SectionHead({ eyebrow, title, sub, center = false, id }) {
  return (
    <div className={`sec-head${center ? " sec-head--center" : ""} reveal`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 id={id}>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

/** Public home page — marketing only; no internal tools or dashboards. */
export default function HomePage() {
  useDocumentTitle(null, null);
  const { user } = useSession();
  const root = useRef(null);
  useReveal(root);
  const hero = photo("machines/agricultural-drone");
  const accuracy = `${(metrics.recommend.test_accuracy * 100).toFixed(1)}%`;
  const r2 = metrics.yield.r2_log.toFixed(2);

  return (
    <div ref={root} className="home-v2">
      {/* 1. Hero */}
      <section className="hp-hero" aria-labelledby="hero-title">
        <div className="container-x hp-hero-grid">
          <div className="hp-hero-text">
            <span className="eyebrow">
              <Sparkles size={14} aria-hidden="true" /> Smart agriculture • AI-powered innovation
            </span>
            <h1 id="hero-title">
              <span>Grow Smarter.</span>
              <span>
                Farm <em>Better.</em>
              </span>
              <span>Build a Sustainable Future.</span>
            </h1>
            <p>
              AgriSmart brings agricultural intelligence, AI-powered crop insights, weather information, soil analysis
              and smart farming solutions together to help farmers make better agricultural decisions.
            </p>
            <div className="hp-cta-row">
              <a href="#overview" className="btn-x btn-x--primary">
                Explore AgriSmart <ArrowRight size={18} aria-hidden="true" />
              </a>
              <Link to={user ? "/dashboard" : "/register"} className="btn-x btn-x--secondary">
                {user ? "Open dashboard" : "Get Started"}
              </Link>
            </div>
            <ul className="hp-highlights" aria-label="Highlights">
              <li>
                <BrainCircuit size={18} aria-hidden="true" /> AI-Powered Insights
              </li>
              <li>
                <Sprout size={18} aria-hidden="true" /> Smart Crop Recommendations
              </li>
              <li>
                <MapPin size={18} aria-hidden="true" /> Location-Based Agriculture
              </li>
            </ul>
          </div>
          <figure className="hp-hero-media">
            <img
              src={hero.src}
              srcSet={hero.srcSet}
              sizes="(max-width: 991px) 100vw, 50vw"
              width={hero.width}
              height={hero.height}
              alt="An agricultural drone spraying a green rice field"
              fetchPriority="high"
            />
            <div className="hp-float hp-float--a">
              <span className="ic" aria-hidden="true">
                <Sprout size={20} />
              </span>
              <span>
                <b>{accuracy}</b>
                <small>crop-model test accuracy</small>
              </span>
            </div>
            <div className="hp-float hp-float--b">
              <span className="ic ic--gold" aria-hidden="true">
                <MapPin size={20} />
              </span>
              <span>
                <b>727 districts</b>
                <small>mapped across India</small>
              </span>
            </div>
          </figure>
        </div>
      </section>

      {/* 2. Platform overview */}
      <section className="sec sec--white" id="overview" aria-labelledby="overview-title">
        <div className="container-x">
          <SectionHead
            id="overview-title"
            eyebrow="Platform overview"
            title="One Platform. Smarter Agriculture."
            sub="Everything needed to understand agricultural conditions and make informed farming decisions."
            center
          />
          <div className="card-grid card-grid--3">
            {OVERVIEW.map(({ icon: Icon, title, text, to }) => (
              <article key={title} className="f-card reveal">
                <span className="ic" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to={to} className="btn-x btn-x--text">
                  Learn more <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Key features */}
      <section className="sec" id="features" aria-labelledby="features-title">
        <div className="container-x">
          <SectionHead
            id="features-title"
            eyebrow="Key features"
            title="Powerful Features for Modern Farming"
            sub="Real, working tools — sign in to use them. Knowledge pages are open to everyone."
          />
          <div className="card-grid">
            {KEY_FEATURES.map(({ icon: Icon, title, text, id, open }) => (
              <article key={id} className="f-card reveal">
                <div className="card-top">
                  <span className="ic" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className={`status-tag status-tag--${open ? "live" : "login"}`}>
                    {open ? "Open to all" : "Sign in to use"}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to={`/features#${id}`} className="btn-x btn-x--text">
                  Details <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="hp-cta-row" style={{ marginTop: "2rem" }}>
            <Link to="/features" className="btn-x btn-x--secondary">
              See all features
            </Link>
          </div>
        </div>
      </section>

      {/* 4. AI solutions */}
      <section className="sec sec--white" id="ai" aria-labelledby="ai-title">
        <div className="container-x ai-split">
          <div className="reveal">
            <span className="eyebrow">AI solutions</span>
            <h2 id="ai-title" style={{ fontSize: "var(--fs-h2)", fontWeight: 800, margin: "0.75rem 0" }}>
              Artificial Intelligence Meets Agriculture
            </h2>
            <p style={{ color: "var(--c-ink-2)", fontSize: "var(--fs-sub)", lineHeight: 1.6 }}>
              Transform agricultural data into practical insights using intelligent data analysis and machine learning.
            </p>
            <ol className="ai-flow" aria-label="How the AI works">
              {["Agricultural data", "Cleaning & features", "Trained models", "Explained insights"].map((s, i) => (
                <li key={s}>
                  <span aria-hidden="true">{i + 1}</span> {s}
                </li>
              ))}
            </ol>
            <div className="metric-row" aria-label="Measured model performance">
              <div>
                <b>{accuracy}</b>
                <small>crop model accuracy on held-out data</small>
              </div>
              <div>
                <b>R² {r2}</b>
                <small>yield model on unseen 2015–2020 seasons (log scale)</small>
              </div>
            </div>
            <div className="hp-cta-row" style={{ marginTop: "1.5rem" }}>
              <Link to="/ai-in-agriculture" className="btn-x btn-x--primary">
                Explore AI Solutions <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="sol-list">
            {SOLUTIONS.map((s) => (
              <article key={s.title} className="sol-card reveal">
                <h3>{s.title}</h3>
                <dl>
                  <dt>Input</dt>
                  <dd>{s.input}</dd>
                  <dt>How it works</dt>
                  <dd>{s.process}</dd>
                  <dt>Output</dt>
                  <dd>{s.output}</dd>
                </dl>
                <p>
                  <b>Use it to:</b> {s.use}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How it works */}
      <section className="sec" id="how-it-works" aria-labelledby="how-title">
        <div className="container-x">
          <SectionHead id="how-title" eyebrow="How it works" title="Smarter Farming in Four Simple Steps" center />
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="reveal">
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>
                  <span className="visually-hidden">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Agriculture intelligence */}
      <section className="sec sec--white" aria-labelledby="env-title">
        <div className="container-x">
          <SectionHead
            id="env-title"
            eyebrow="Agriculture intelligence"
            title="Understand Your Agricultural Environment"
            sub="What AgriSmart analyses for your location — and where each value comes from. Live values appear after you select a location."
          />
          <div className="param-grid">
            {PARAMS.map(({ icon: Icon, title, text, src }) => (
              <div key={title} className="param reveal">
                <span className="ic" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <small>{src}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Benefits */}
      <section className="sec" aria-labelledby="benefits-title">
        <div className="container-x split-photo">
          <img
            src={photo("systems/crop-production-systems").src}
            srcSet={photo("systems/crop-production-systems").srcSet}
            sizes="(max-width: 991px) 100vw, 50vw"
            width="1200"
            height="800"
            loading="lazy"
            decoding="async"
            alt="Women farm workers walking between rows of young crops in Gujarat"
            className="reveal"
          />
          <div>
            <SectionHead id="benefits-title" eyebrow="Benefits" title="Why Choose AgriSmart?" />
            <ul className="benefit-list">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="reveal">
                  <span className="ic" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span>
                    <b>{title}</b>
                    <span>{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec sec--white" aria-labelledby="faq-title">
        <div className="container-x">
          <SectionHead id="faq-title" eyebrow="FAQ" title="Questions farmers ask" center />
          <div className="faq-x">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="sec" aria-labelledby="cta-title">
        <div className="container-x">
          <div className="final-cta reveal">
            <h2 id="cta-title">The Future of Farming Starts Here.</h2>
            <p>Discover how agricultural intelligence and technology can support smarter farming decisions.</p>
            <div className="hp-cta-row" style={{ justifyContent: "center" }}>
              <Link to={user ? "/dashboard" : "/register"} className="btn-x btn-x--light">
                {user ? "Open your dashboard" : "Create Your Account"} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/features" className="btn-x btn-x--ghost-light">
                Explore AgriSmart
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
