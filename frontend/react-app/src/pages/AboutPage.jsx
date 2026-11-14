import { ArrowRight, BrainCircuit, Eye, HandHeart, Leaf, Lightbulb, Scale, ShieldCheck, Sprout, Target, Users, Wheat } from "lucide-react";
import { Link } from "react-router";

import { CtaBand, PageHero, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { BRAND, OWNER } from "@/data/site";

const PILLARS = [
  {
    icon: Wheat,
    title: "Agricultural production systems",
    text: "The ways farms combine land, water, seed, labour and management — from subsistence plots to precision farms.",
    to: "/agricultural-production-systems",
  },
  {
    icon: Sprout,
    title: "Why modern agriculture matters",
    text: "Feeding a growing population from limited land and water needs better seeds, machines, knowledge and data.",
    to: "/smart-agricultural-machines",
  },
  {
    icon: Leaf,
    title: "Sustainable farming",
    text: "Protecting soil, water and biodiversity so farms stay productive for the next generation.",
    to: "/agricultural-production-systems/sustainable-agriculture",
  },
  {
    icon: Lightbulb,
    title: "Agricultural innovation",
    text: "Drones, sensors, robots and digital platforms are changing how crops are grown, monitored and sold.",
    to: "/smart-agricultural-machines",
  },
  {
    icon: BrainCircuit,
    title: "AI-driven farming solutions",
    text: "Machine learning for crop recommendation, yield prediction, disease detection and irrigation planning.",
    to: "/ai-in-agriculture",
  },
  {
    icon: Users,
    title: "Farmer empowerment",
    text: "Free, easy tools and plain-language knowledge so farmers make confident, informed decisions.",
    to: "/farmer-education",
  },
  {
    icon: Scale,
    title: "Food security",
    text: "Enough safe, nutritious food for everyone, all the time — from production to storage and distribution.",
    to: "/crops-and-food",
  },
  {
    icon: ShieldCheck,
    title: "Environmental protection",
    text: "Precise use of water, fertilizer and pesticides reduces pollution and greenhouse-gas emissions.",
    to: "/agricultural-production-systems/precision-agriculture",
  },
];

const OBJECTIVES = [
  "Explain agricultural production systems, machinery and technology in clear, practical language.",
  "Provide free AI tools for crop choice, yield, soil, fertilizer, irrigation and weather.",
  "Promote sustainable practices that protect soil, water and farmer health.",
  "Share verified, up-to-date information on farmer welfare schemes with official links.",
  "Support rural well-being with health, safety and nutrition awareness.",
];

const VALUES = [
  { icon: ShieldCheck, title: "Honesty", text: "Verified facts, clear limits on AI predictions, no fake claims." },
  { icon: Users, title: "Farmer first", text: "Built for real decisions on real farms, in simple language." },
  { icon: Leaf, title: "Sustainability", text: "Better yields that do not cost the land its future." },
  { icon: Lightbulb, title: "Innovation", text: "Practical technology that is affordable and accessible." },
  { icon: HandHeart, title: "Inclusion", text: "Free to use, no sign-up, works on low-cost phones." },
];

export default function AboutPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="About AgriSmart"
        title="Growing Smarter, Farming Better"
        lead={`${BRAND.name} brings agricultural knowledge, smart-farming technology and free AI tools together in one place — for farmers, students, agri-professionals and anyone who cares about food.`}
        image="education/farmers-in-field"
        imageAlt="Farmers working together in a field"
      >
        <Link to="/agricultural-production-systems" className="site-btn site-btn--gold">
          Explore agriculture <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link to="/developer" className="site-btn site-btn--ghost">
          Meet the developer
        </Link>
      </PageHero>

      <section className="site-section mv-grid" id="mission" aria-label="Mission and vision">
        <article className="mv-card mv-card--mission">
          <Target size={28} aria-hidden="true" />
          <h2>Our mission</h2>
          <p>Empower agriculture through technology, knowledge and sustainable innovation.</p>
        </article>
        <article className="mv-card mv-card--vision">
          <Eye size={28} aria-hidden="true" />
          <h2>Our vision</h2>
          <p>Build a smarter, more productive and sustainable agricultural future.</p>
        </article>
      </section>

      <section className="site-section" aria-labelledby="pillars-title">
        <SectionTitle id="pillars-title" kicker="What we cover" title="Understanding modern agriculture" />
        <div className="pillar-cards">
          {PILLARS.map(({ icon: Icon, title, text, to }) => (
            <Link key={title} to={to} className="pillar-card">
              <span className="ai-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section split-media" aria-labelledby="objectives-title">
        <SitePhoto image="education/sustainable-development" alt="Solar panels powering irrigation beside rice fields" sizes="(max-width: 992px) 100vw, 45vw" />
        <div>
          <SectionTitle id="objectives-title" kicker="Objectives" title="What AgriSmart sets out to do" />
          <ol className="process-list">
            {OBJECTIVES.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-section" aria-labelledby="values-title">
        <SectionTitle id="values-title" kicker="Core values" title="What we stand for" align="center" />
        <div className="values-row">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="value-item">
              <Icon size={26} aria-hidden="true" />
              <b>{title}</b>
              <small>{text}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section about-dev">
        <div>
          <span className="site-kicker">Built by</span>
          <h2>{OWNER.name}</h2>
          <p>
            {OWNER.title} based in {OWNER.location}. AgriSmart is an independent project and grew out of his B.Tech
            major project on crop yield prediction.
          </p>
          <Link to="/developer" className="site-more">
            Developer profile <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
