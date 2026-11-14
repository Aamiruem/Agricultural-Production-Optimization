import { ArrowRight, CheckCircle2, ListOrdered, MapPin, TriangleAlert } from "lucide-react";
import { Link, useParams } from "react-router";

import { CtaBand, PageHero, Reviewed, SitePhoto } from "@/components/site/SiteKit";
import { PRODUCTION_SYSTEMS, SYSTEM_BY_SLUG } from "@/data/content/productionSystems";
import { BRAND } from "@/data/site";
import NotFoundPage from "@/pages/NotFoundPage";

export default function ProductionSystemPage() {
  const { slug } = useParams();
  const s = SYSTEM_BY_SLUG[slug];
  if (!s) return <NotFoundPage />;
  const index = PRODUCTION_SYSTEMS.indexOf(s);
  const next = PRODUCTION_SYSTEMS[(index + 1) % PRODUCTION_SYSTEMS.length];

  return (
    <div className="site-page">
      <PageHero kicker="Agricultural production systems" title={s.title} lead={s.summary} image={s.image} imageAlt={s.alt} compact />

      <div className="article-layout">
        <article className="article-main">
          <section aria-labelledby="definition">
            <h2 id="definition">Definition</h2>
            <p className="lead-text">{s.definition}</p>
          </section>

          <section aria-labelledby="importance">
            <h2 id="importance">Why it matters</h2>
            <p>{s.importance}</p>
          </section>

          <section aria-labelledby="process">
            <h2 id="process">
              <ListOrdered size={22} aria-hidden="true" /> How it works
            </h2>
            <ol className="process-list">
              {s.process.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="pros-cons">
            <section className="pros" aria-labelledby="advantages">
              <h2 id="advantages">
                <CheckCircle2 size={22} aria-hidden="true" /> Advantages
              </h2>
              <ul>
                {s.advantages.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
            <section className="cons" aria-labelledby="limitations">
              <h2 id="limitations">
                <TriangleAlert size={22} aria-hidden="true" /> Limitations
              </h2>
              <ul>
                {s.limitations.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="india-note" aria-labelledby="india">
            <h2 id="india">
              <MapPin size={22} aria-hidden="true" /> In India
            </h2>
            <p>{s.india}</p>
          </section>

          <Reviewed date={BRAND.contentUpdated} />
        </article>

        <aside className="article-aside" aria-label="Related">
          {s.tools?.length > 0 && (
            <div className="aside-card">
              <h2>Try the free tools</h2>
              <ul>
                {s.tools.map((t) => (
                  <li key={t.to}>
                    <Link to={t.to}>
                      {t.label} <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="aside-card">
            <h2>Related topics</h2>
            <ul className="aside-related">
              {s.related.map((slug) => {
                const r = SYSTEM_BY_SLUG[slug];
                return (
                  <li key={slug}>
                    <Link to={`/agricultural-production-systems/${slug}`}>
                      <SitePhoto image={r.image} alt="" sizes="96px" />
                      <span>{r.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="aside-card">
            <h2>Explore more</h2>
            <ul>
              <li>
                <Link to="/agricultural-production-systems">All production systems</Link>
              </li>
              <li>
                <Link to="/smart-agricultural-machines">Smart agricultural machines</Link>
              </li>
              <li>
                <Link to="/ai-in-agriculture">AI in agriculture</Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <nav className="next-topic" aria-label="Next topic">
        <span>Next topic</span>
        <Link to={`/agricultural-production-systems/${next.slug}`}>
          {next.title} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </nav>

      <CtaBand />
    </div>
  );
}
