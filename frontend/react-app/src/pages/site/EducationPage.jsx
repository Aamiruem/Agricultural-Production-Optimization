import {
  ArrowRight,
  Beaker,
  BookOpen,
  Bug,
  ClipboardList,
  Cpu,
  Droplets,
  ExternalLink,
  FlaskConical,
  IndianRupee,
  Landmark,
  Leaf,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import { Link } from "react-router";

import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { EDUCATION_TOPICS, GOVERNMENT_SCHEMES, OFFICIAL_PORTALS, SCHEMES_CHECKED } from "@/data/content/education";
import { BRAND } from "@/data/site";

const ICONS = { Cpu, FlaskConical, Sprout, Droplets, Bug, Beaker, ClipboardList, IndianRupee, Leaf, Landmark };

export default function EducationPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Agricultural knowledge"
        title="Farmer Education and Resources"
        lead="Practical lessons on modern techniques, soil testing, seeds, irrigation, crop protection, fertilizers, farm management and economics — plus official government schemes for farmers."
        image="education/modern-farming"
        imageAlt="Farmers at a co-composting training session"
      >
        <a href="#topics" className="site-btn site-btn--gold">
          Start learning <ArrowRight size={18} aria-hidden="true" />
        </a>
        <a href="#schemes" className="site-btn site-btn--ghost">
          Government schemes
        </a>
      </PageHero>

      <section className="site-section" id="topics" aria-labelledby="topics-title">
        <SectionTitle id="topics-title" kicker="10 lessons" title="Essential farming knowledge" />
        <div className="edu-grid">
          {EDUCATION_TOPICS.map((t) => {
            const Icon = ICONS[t.icon] ?? BookOpen;
            return (
              <article key={t.id} id={t.id} className={`edu-card${t.image ? " edu-card--photo" : ""}`}>
                {t.image && <SitePhoto image={t.image} alt={t.alt} sizes="(max-width: 768px) 100vw, 33vw" />}
                <div className="edu-body">
                  <h3>
                    <span className="ai-icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    {t.title}
                  </h3>
                  <p>{t.text}</p>
                  <ul>
                    {t.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  {t.link && (
                    <Link to={t.link.to} className="site-more">
                      {t.link.label} <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p className="muted-note">
          More learning: <Link to="/learn">knowledge hub</Link> · <Link to="/soil-types">soil types of India</Link> ·{" "}
          <Link to="/agricultural-production-systems">production systems</Link>
        </p>
      </section>

      <section className="site-section" id="schemes" aria-labelledby="schemes-title">
        <SectionTitle
          id="schemes-title"
          kicker="Official information"
          title="Government agricultural schemes"
          lead="Key central government schemes for farmers. Eligibility, amounts and deadlines change — always confirm on the official portal before applying."
        />
        <p className="checked-note">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            Details checked against official portals on{" "}
            <time dateTime={SCHEMES_CHECKED}>
              {new Date(`${SCHEMES_CHECKED}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </time>
            . Figures are quoted only where the official page states them.
          </span>
        </p>
        <div className="scheme-grid">
          {GOVERNMENT_SCHEMES.map((s) => (
            <article key={s.id} className="scheme-card">
              <header>
                <h3>{s.name}</h3>
                <small>{s.full}</small>
              </header>
              <p className="scheme-since">{s.since}</p>
              <p>{s.benefit}</p>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="site-more">
                Official portal <ExternalLink size={15} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
        <div className="portal-row">
          <span>Other official portals:</span>
          {OFFICIAL_PORTALS.map((p) => (
            <a key={p.href} href={p.href} target="_blank" rel="noopener noreferrer">
              {p.name} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="muted-note">
          AgriSmart is an independent educational website and is not affiliated with or endorsed by any government
          body. For help applying, contact your Krishi Vigyan Kendra or the Kisan Call Centre (1800-180-1551).
        </p>
        <Reviewed date={BRAND.contentUpdated} />
      </section>

      <CtaBand />
    </div>
  );
}
