import { ArrowRight, Cog, Sprout, Target, ThumbsUp } from "lucide-react";
import { Link } from "react-router";

import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { MACHINES } from "@/data/content/machines";
import { BRAND } from "@/data/site";

export default function MachinesPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Modern farming equipment"
        title="Smart Agricultural Machines"
        lead="From GPS-guided tractors and combine harvesters to drones, robots and sensors — how modern farm machinery saves time, inputs and labour while raising yields."
        image="machines/combine-harvester"
        imageAlt="A combine harvester cutting ripe wheat"
      >
        <a href="#machines" className="site-btn site-btn--gold">
          See all 12 machines <ArrowRight size={18} aria-hidden="true" />
        </a>
        <Link to="/ai-in-agriculture" className="site-btn site-btn--ghost">
          AI in agriculture
        </Link>
      </PageHero>

      <section className="site-section site-intro">
        <div className="site-prose">
          <h2>Why farm mechanisation and automation matter</h2>
          <p>
            Timely field operations decide yield. Machines let farmers prepare land, sow, protect and harvest crops
            within the right window, even when labour is scarce. Smart machinery adds sensors, GPS and software, so
            inputs are applied precisely and every pass produces data for better decisions. Small farmers can access
            many of these machines through custom hiring centres and FPOs instead of buying them.
          </p>
        </div>
        <nav className="chip-nav" aria-label="Jump to a machine">
          {MACHINES.map((m) => (
            <a key={m.slug} href={`#${m.slug}`} className="chip-link">
              {m.name}
            </a>
          ))}
        </nav>
      </section>

      <section className="site-section" id="machines" aria-labelledby="machines-title">
        <SectionTitle id="machines-title" kicker="Equipment guide" title="12 smart machines transforming agriculture" />
        <div className="machine-list">
          {MACHINES.map((m, i) => (
            <article key={m.slug} id={m.slug} className={`machine-card${i % 2 ? " machine-card--flip" : ""}`}>
              <figure className="machine-media">
                <SitePhoto image={m.image} alt={m.alt} sizes="(max-width: 992px) 100vw, 50vw" />
                <figcaption>{m.category}</figcaption>
              </figure>
              <div className="machine-body">
                <span className="machine-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{m.name}</h3>
                <p>{m.description}</p>
                <p className="machine-function">
                  <Target size={18} aria-hidden="true" />
                  <span>
                    <b>Primary function:</b> {m.function}
                  </span>
                </p>
                <div className="machine-cols">
                  <div>
                    <h4>
                      <Cog size={16} aria-hidden="true" /> Key features
                    </h4>
                    <ul>
                      {m.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>
                      <Sprout size={16} aria-hidden="true" /> Applications
                    </h4>
                    <ul>
                      {m.applications.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>
                      <ThumbsUp size={16} aria-hidden="true" /> Benefits for farmers
                    </h4>
                    <ul>
                      {m.benefits.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {m.note && <p className="machine-note">{m.note}</p>}
              </div>
            </article>
          ))}
        </div>
        <Reviewed date={BRAND.contentUpdated} />
      </section>

      <section className="site-section">
        <SectionTitle kicker="Access" title="How small farmers can use smart machines" />
        <div className="info-grid">
          <div className="info-card">
            <h3>Custom hiring centres</h3>
            <p>Rent tractors, harvesters, drills and sprayers by the hour or acre instead of buying.</p>
          </div>
          <div className="info-card">
            <h3>Government support</h3>
            <p>
              The Sub-Mission on Agricultural Mechanization (SMAM) provides subsidy for machinery. See{" "}
              <Link to="/farmer-education#schemes">government schemes</Link>.
            </p>
          </div>
          <div className="info-card">
            <h3>FPO ownership</h3>
            <p>Farmer producer organisations can jointly own machines and share them among members.</p>
          </div>
          <div className="info-card">
            <h3>Safety first</h3>
            <p>
              Train operators, keep guards in place and switch off before clearing blockages. Read our{" "}
              <Link to="/farmer-health#farm-safety">farm safety guide</Link>.
            </p>
          </div>
        </div>
      </section>

      <CtaBand title="Need software for machinery data or farm dashboards?" />
    </div>
  );
}
