import {
  ArrowRight,
  BarChart3,
  Beaker,
  Bot,
  CloudSun,
  Droplets,
  FlaskConical,
  IndianRupee,
  Layers,
  Satellite,
  ScanSearch,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router";

import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { AI_SOLUTIONS, AI_TECH, ML_WORKFLOW } from "@/data/content/aiSolutions";
import { BRAND } from "@/data/site";

const ICONS = {
  Sprout,
  TrendingUp,
  Layers,
  FlaskConical,
  ScanSearch,
  CloudSun,
  Beaker,
  Droplets,
  BarChart3,
  IndianRupee,
  Satellite,
  Bot,
};

function Workflow() {
  return (
    <ol className="ml-flow" aria-label="Machine-learning workflow in seven stages">
      {ML_WORKFLOW.map((w, i) => (
        <li key={w.step}>
          <span className="ml-flow-num" aria-hidden="true">
            {i + 1}
          </span>
          <b>{w.step}</b>
          <small>{w.detail}</small>
        </li>
      ))}
    </ol>
  );
}

export default function AiSolutionsPage() {
  const featured = AI_SOLUTIONS.filter((s) => s.image);
  return (
    <div className="site-page">
      <PageHero
        kicker="Artificial intelligence & machine learning"
        title="AI in Agriculture"
        lead="How machine learning turns soil, weather, satellite and market data into better farm decisions — from choosing the right crop to predicting yield, spotting disease and planning irrigation."
        image="ai/satellite-monitoring"
        imageAlt="Satellite view of a patchwork of agricultural fields"
      >
        <Link to="/crop-recommendation" className="site-btn site-btn--gold">
          Try the AI crop advisor <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <a href="#workflow" className="site-btn site-btn--ghost">
          See the ML workflow
        </a>
      </PageHero>

      <section className="site-section site-intro">
        <div className="site-prose">
          <h2>What AI brings to farming</h2>
          <p>
            Farming decisions depend on many interacting factors — soil nutrients, rainfall, temperature, pests,
            varieties and prices. Machine-learning models learn these patterns from historical data and apply them to a
            new field or season in seconds. Used well, AI helps farmers <strong>increase productivity</strong>,{" "}
            <strong>reduce input waste</strong> and <strong>manage risk</strong>. It supports — not replaces — local
            expertise, soil tests and agricultural extension officers.
          </p>
        </div>
      </section>

      <section className="site-section" id="workflow" aria-labelledby="workflow-title">
        <SectionTitle
          id="workflow-title"
          kicker="Process flow"
          title="From farm data to farmer recommendations"
          lead="Every AgriSmart model follows the same seven-stage machine-learning workflow."
          align="center"
        />
        <Workflow />
      </section>

      <section className="site-section" aria-labelledby="solutions-title">
        <SectionTitle id="solutions-title" kicker="12 solutions" title="AI and ML solutions for agriculture" />
        <div className="ai-grid">
          {AI_SOLUTIONS.map((s) => {
            const Icon = ICONS[s.icon] ?? Sprout;
            return (
              <article key={s.slug} id={s.slug} className="ai-card">
                <header>
                  <span className="ai-icon" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <h3>{s.name}</h3>
                  {s.status === "concept" && (
                    <span className="status-pill status-pill--grey">Explainer · tool planned</span>
                  )}
                </header>
                <p className="ai-problem">{s.problem}</p>
                <div className="ai-pipeline" aria-label={`${s.name} data flow`}>
                  <div>
                    <small>Inputs</small>
                    <ul>
                      {s.inputs.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <ArrowRight size={18} aria-hidden="true" className="ai-arrow" />
                  <div>
                    <small>Model</small>
                    <p>{s.model}</p>
                  </div>
                  <ArrowRight size={18} aria-hidden="true" className="ai-arrow" />
                  <div>
                    <small>Output</small>
                    <p>{s.output}</p>
                  </div>
                </div>
                <p className="ai-example">
                  <b>Example:</b> {s.example}
                </p>
                {s.tool && (
                  <Link to={s.tool.to} className="site-more">
                    {s.tool.label} <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="site-section" aria-labelledby="gallery-title">
        <SectionTitle id="gallery-title" kicker="Data sources" title="Where agricultural AI gets its data" />
        <div className="photo-grid photo-grid--3">
          {featured.map((s) => (
            <figure key={s.slug} className="photo-tile">
              <SitePhoto image={s.image} alt={s.alt} sizes="(max-width: 768px) 100vw, 33vw" />
              <figcaption>{s.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="tech-title">
        <SectionTitle id="tech-title" kicker="Technology stack" title="Tools used to build agricultural AI" />
        <ul className="tech-grid">
          {AI_TECH.map((t) => (
            <li key={t.name}>
              <b>{t.name}</b>
              <small>{t.role}</small>
            </li>
          ))}
        </ul>
        <p className="muted-note">
          AgriSmart&apos;s own models are trained with Python, Pandas and Scikit-learn and served through FastAPI, with
          lightweight copies running in your browser. See <Link to="/insights">model accuracy and metrics</Link>.
        </p>
        <Reviewed date={BRAND.contentUpdated} />
      </section>

      <CtaBand
        title="Build an AI solution for your farm or agri-business"
        text="AI/ML development, crop prediction systems and data analytics — talk to the developer directly."
      />
    </div>
  );
}
