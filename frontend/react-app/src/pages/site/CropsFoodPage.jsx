import { Apple, ArrowRight, Bean, Carrot, Droplet, Factory, Flower2, Wheat } from "lucide-react";
import { Link } from "react-router";

import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import {
  CROP_CATEGORIES,
  CROP_SEASONS,
  FOOD_CHAIN,
  FOOD_GALLERY,
  FOOD_SECURITY,
  POST_HARVEST,
} from "@/data/content/cropsFood";
import { BRAND } from "@/data/site";

const ICONS = { Wheat, Bean, Droplet, Apple, Carrot, Factory, Flower2 };

export default function CropsFoodPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Crops & food production"
        title="Crops and Food Production in India"
        lead="India's three cropping seasons, the main crop groups and the journey of food from field to plate — including post-harvest care, storage, supply chains and food security."
        image="food/harvesting"
        imageAlt="A woman harvesting ripe rice by hand"
      >
        <a href="#seasons" className="site-btn site-btn--gold">
          Crop seasons <ArrowRight size={18} aria-hidden="true" />
        </a>
        <Link to="/crop-gallery" className="site-btn site-btn--ghost">
          Photo guide to 45 crops
        </Link>
      </PageHero>

      <section className="site-section" id="seasons" aria-labelledby="seasons-title">
        <SectionTitle
          id="seasons-title"
          kicker="Cropping seasons"
          title="Kharif, Rabi and Zaid crops"
          lead="Indian agriculture follows the monsoon. Each season has its own sowing window and crops."
        />
        <div className="season-grid">
          {CROP_SEASONS.map((s) => (
            <article key={s.id} className={`season-card season-card--${s.id}`}>
              <img src={s.image} alt={s.alt} width="800" height="533" loading="lazy" decoding="async" />
              <div>
                <h3>
                  {s.name} <span lang="hi">{s.hindi}</span>
                </h3>
                <p className="season-months">{s.months}</p>
                <p>{s.about}</p>
                <ul className="tag-list">
                  {s.crops.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <p className="muted-note">
          Find crops for your state and season with the <Link to="/seasonal-advisor">seasonal advisor</Link>.
        </p>
      </section>

      <section className="site-section" aria-labelledby="cat-title">
        <SectionTitle id="cat-title" kicker="Crop categories" title="Major groups of crops" />
        <div className="category-grid">
          {CROP_CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon] ?? Wheat;
            return (
              <article key={c.name} className="category-card">
                <span className="ai-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{c.name}</h3>
                <p className="category-examples">{c.examples}</p>
                <p>{c.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="site-section" aria-labelledby="gallery-title">
        <SectionTitle id="gallery-title" kicker="Gallery" title="From fields to food" />
        <div className="photo-grid">
          {FOOD_GALLERY.map((g) => (
            <figure key={g.image} className="photo-tile">
              <SitePhoto image={g.image} alt={g.alt} sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" />
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="chain-title">
        <SectionTitle
          id="chain-title"
          kicker="Food supply chain"
          title="How food production works"
          lead="Food passes through many hands between the farm and your plate. Losses at any stage reduce income and food availability."
        />
        <ol className="chain-flow">
          {FOOD_CHAIN.map((c, i) => (
            <li key={c.step}>
              <span aria-hidden="true">{i + 1}</span>
              <b>{c.step}</b>
              <small>{c.detail}</small>
            </li>
          ))}
        </ol>
        <div className="split-media">
          <SitePhoto
            image="food/supply-chain"
            alt="A truck carrying sacks of potatoes to cold storage on an Indian highway"
            sizes="(max-width: 992px) 100vw, 45vw"
          />
          <div>
            <h3>Supply chains and storage</h3>
            <p>
              Mandis, e-NAM, farmer producer organisations, wholesalers, retailers and the public distribution system
              connect farms with consumers. Warehouses, silos and cold storage protect food between harvest and sale,
              and allow farmers to avoid selling at the lowest post-harvest prices.
            </p>
            <p>
              Government-backed facilities such as the Agriculture Infrastructure Fund support investment in warehouses,
              cold chains and processing units close to farms. <Link to="/farmer-education#schemes">See schemes</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="ph-title">
        <SectionTitle id="ph-title" kicker="Post-harvest management" title="Reduce losses after harvest" />
        <div className="info-grid">
          {POST_HARVEST.map((p) => (
            <div key={p.title} className="info-card">
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="fs-title">
        <SectionTitle
          id="fs-title"
          kicker="Food security"
          title="The four pillars of food security"
          lead="Food security exists when all people, at all times, have access to sufficient, safe and nutritious food (FAO). In India, the National Food Security Act, 2013 provides legal entitlement to subsidised food grains for eligible households."
        />
        <div className="pillar-grid">
          {FOOD_SECURITY.map((p) => (
            <div key={p.pillar} className="pillar">
              <b>{p.pillar}</b>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
        <p className="muted-note">
          Explore more: <Link to="/crops">crop library</Link> · <Link to="/states">state-wise agriculture</Link> ·{" "}
          <Link to="/food-and-nutrition">food &amp; nutrition</Link>
        </p>
        <Reviewed date={BRAND.contentUpdated} />
      </section>

      <CtaBand />
    </div>
  );
}
