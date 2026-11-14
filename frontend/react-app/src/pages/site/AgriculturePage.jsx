import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { PRODUCTION_GROUPS, PRODUCTION_SYSTEMS } from "@/data/content/productionSystems";
import { BRAND } from "@/data/site";

export default function AgriculturePage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Agricultural production systems"
        title="Agricultural Production Systems"
        lead="How farms turn land, water, seed and knowledge into food. Explore 16 farming systems and practices — each with its definition, importance, working process, advantages and limitations."
        image="systems/crop-production-systems"
        imageAlt="Women farm workers walking between rows of young crops in Gujarat"
      >
        <a href="#systems" className="site-btn site-btn--gold">
          Start exploring <ArrowRight size={18} aria-hidden="true" />
        </a>
        <Link to="/smart-agricultural-machines" className="site-btn site-btn--ghost">
          Smart machines
        </Link>
      </PageHero>

      <section className="site-section site-intro">
        <div className="site-prose">
          <h2>What is an agricultural production system?</h2>
          <p>
            An <strong>agricultural production system</strong> is the way a farm combines natural resources (soil, water,
            climate), inputs (seed, nutrients, energy), labour, machinery and management to produce crops and livestock.
            The right system depends on farm size, rainfall and irrigation, soils, markets and the farmer&apos;s goals —
            from feeding a household to supplying national and export markets.
          </p>
          <p>
            Modern systems increasingly add data and technology: soil testing, precision application, smart irrigation
            and <Link to="/ai-in-agriculture">AI in agriculture</Link> help farmers grow more with less water, fertilizer
            and risk, while <Link to="/agricultural-production-systems/sustainable-agriculture">sustainable practices</Link>{" "}
            keep land productive for the future.
          </p>
        </div>
      </section>

      {PRODUCTION_GROUPS.map((g, i) => (
        <section key={g.id} className="site-section" id={g.id} aria-labelledby={`grp-${g.id}`}>
          <SectionTitle id={`grp-${g.id}`} kicker={`Part ${i + 1}`} title={g.title} lead={g.lead} />
          <div className="topic-grid">
            {PRODUCTION_SYSTEMS.filter((s) => s.group === g.id).map((s) => (
              <article key={s.slug} className="topic-card">
                <Link to={`/agricultural-production-systems/${s.slug}`} className="topic-card-link">
                  <SitePhoto image={s.image} alt={s.alt} sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                  <div className="topic-card-body">
                    <h3>{s.title}</h3>
                    <p>{s.summary}</p>
                    <span className="site-more">
                      Definition, process, pros &amp; cons <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="site-section">
        <SectionTitle kicker="At a glance" title="Comparing farming systems" />
        <div className="table-scroll">
          <table className="site-table">
            <caption className="visually-hidden">Comparison of major farming systems</caption>
            <thead>
              <tr>
                <th scope="col">System</th>
                <th scope="col">Main goal</th>
                <th scope="col">Inputs per hectare</th>
                <th scope="col">Typical Indian example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Subsistence</th>
                <td>Feed the household</td>
                <td>Low</td>
                <td>Rain-fed hill and tribal farms</td>
              </tr>
              <tr>
                <th scope="row">Commercial</th>
                <td>Profit from sales</td>
                <td>Medium–high</td>
                <td>Sugarcane, cotton, tea estates</td>
              </tr>
              <tr>
                <th scope="row">Intensive</th>
                <td>Maximum output per hectare</td>
                <td>High</td>
                <td>Polyhouse vegetables, irrigated Punjab</td>
              </tr>
              <tr>
                <th scope="row">Extensive</th>
                <td>Use large, low-input areas</td>
                <td>Low</td>
                <td>Pastoral systems of Rajasthan</td>
              </tr>
              <tr>
                <th scope="row">Organic</th>
                <td>Chemical-free, soil-building</td>
                <td>Organic only</td>
                <td>Sikkim, PKVY clusters</td>
              </tr>
              <tr>
                <th scope="row">Integrated / mixed</th>
                <td>Diversified, recycled income</td>
                <td>Medium</td>
                <td>Rice–fish, crop–dairy farms</td>
              </tr>
              <tr>
                <th scope="row">Precision</th>
                <td>Right input, right place</td>
                <td>Optimised</td>
                <td>Soil-test doses, drone spraying</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Reviewed date={BRAND.contentUpdated} />
      </section>

      <CtaBand title="Want AI tools for your own farm?" text="Use the free crop advisor and yield forecast, or contact AgriSmart's developer for a custom solution." />
    </div>
  );
}
