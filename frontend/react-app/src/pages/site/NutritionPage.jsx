import { Archive, ArrowRight, ExternalLink, HeartPulse, Sprout, Zap } from "lucide-react";
import { Link } from "react-router";

import { MedicalDisclaimer } from "@/components/site/MedicalDisclaimer";
import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { NUTRITION_CATEGORIES, NUTRITION_SOURCES } from "@/data/content/nutrition";
import { BRAND } from "@/data/site";

export default function NutritionPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Food & nutrition"
        title="Food and Nutrition: From Farm to Plate"
        lead="What different foods give your body, where they come from on the farm and how to store them — fruits, vegetables, organic food, cereals, pulses, dairy, nuts and a balanced Indian plate."
        image="nutrition/healthy-fruits"
        imageAlt="Colourful fresh fruits arranged on a wooden crate"
      >
        <a href="#categories" className="site-btn site-btn--gold">
          Explore food groups <ArrowRight size={18} aria-hidden="true" />
        </a>
        <Link to="/farmer-health" className="site-btn site-btn--ghost">
          Farmer health
        </Link>
      </PageHero>

      <nav className="site-section chip-nav" aria-label="Food groups">
        {NUTRITION_CATEGORIES.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="chip-link">
            {c.name}
          </a>
        ))}
      </nav>

      <section className="site-section" id="categories" aria-labelledby="cat-title">
        <SectionTitle id="cat-title" kicker="Food groups" title="Eight food groups and why they matter" />
        <div className="nutrition-list">
          {NUTRITION_CATEGORIES.map((c) => (
            <article key={c.id} id={c.id} className="nutrition-card">
              <SitePhoto image={c.image} alt={c.alt} sizes="(max-width: 768px) 100vw, 40vw" />
              <div className="nutrition-body">
                <h3>{c.name}</h3>
                <ul className="tag-list" aria-label="Key nutrients">
                  {c.nutrients.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                {c.guide && <p className="nutrition-guide">{c.guide}</p>}
                <div className="nutrition-cols">
                  <div>
                    <h4>
                      <HeartPulse size={16} aria-hidden="true" /> Health benefits
                    </h4>
                    <ul>
                      {c.benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>
                      <Sprout size={16} aria-hidden="true" /> Agricultural source
                    </h4>
                    <p>{c.source}</p>
                  </div>
                  <div>
                    <h4>
                      <Archive size={16} aria-hidden="true" /> Storage tips
                    </h4>
                    <ul>
                      {c.storage.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="tips-title">
        <SectionTitle id="tips-title" kicker="Everyday habits" title="Simple nutrition habits for farm families" />
        <div className="info-grid">
          <div className="info-card">
            <Zap size={22} aria-hidden="true" />
            <h3>Eat for the work you do</h3>
            <p>
              Heavy field work needs more energy and water. Do not skip breakfast; carry water and a snack to the field.
            </p>
          </div>
          <div className="info-card">
            <Sprout size={22} aria-hidden="true" />
            <h3>Grow a kitchen garden</h3>
            <p>A small nutrition garden of leafy greens, beans, tomatoes and papaya improves diets at very low cost.</p>
          </div>
          <div className="info-card">
            <HeartPulse size={22} aria-hidden="true" />
            <h3>Prevent anaemia</h3>
            <p>
              Combine iron-rich greens, pulses and millets with vitamin C foods such as lemon or amla to absorb more
              iron.
            </p>
          </div>
          <div className="info-card">
            <Archive size={22} aria-hidden="true" />
            <h3>Keep food safe</h3>
            <p>Wash hands, use clean water, cover food and do not keep cooked food at room temperature for long.</p>
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="src-title">
        <SectionTitle id="src-title" kicker="Trusted sources" title="Learn more from official nutrition bodies" />
        <ul className="source-list">
          {NUTRITION_SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.name} <ExternalLink size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <Reviewed date={BRAND.contentUpdated} />
        <MedicalDisclaimer />
      </section>

      <CtaBand />
    </div>
  );
}
