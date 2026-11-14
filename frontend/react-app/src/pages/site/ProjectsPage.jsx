import { ArrowRight, ExternalLink, Globe, Info } from "lucide-react";
import { Link } from "react-router";

import { CtaBand, GithubIcon, PageHero, SectionTitle } from "@/components/site/SiteKit";
import { PROJECTS, PROJECTS_VERIFIED_ON, UNVERIFIED_PROJECTS } from "@/data/content/projects";
import { OWNER } from "@/data/site";

function ProjectLinks({ p }) {
  const liveInternal = p.live?.startsWith("/");
  return (
    <div className="project-links">
      {p.live &&
        (liveInternal ? (
          <Link to={p.live} className="site-btn site-btn--sm site-btn--primary">
            Live demo <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <a href={p.live} target="_blank" rel="noopener noreferrer" className="site-btn site-btn--sm site-btn--primary">
            {p.liveLabel ?? "Live demo"} <ExternalLink size={15} aria-hidden="true" />
          </a>
        ))}
      <a href={p.github} target="_blank" rel="noopener noreferrer" className="site-btn site-btn--sm site-btn--light">
        <GithubIcon size={15} /> {p.githubNote ? "GitHub profile" : "GitHub repository"}
      </a>
    </div>
  );
}

export default function ProjectsPage() {
  const [featured, ...rest] = PROJECTS;
  return (
    <div className="site-page">
      <PageHero
        kicker="Portfolio"
        title="Projects by Aamir Hussain Azad"
        lead="AI/ML, data analytics and full-stack projects, verified against the public portfolio and GitHub repositories. Live links appear only where a live version exists."
        image="ai/soil-analysis"
        imageAlt="A scientist analysing soil samples in a laboratory"
      >
        <a href={OWNER.portfolio} target="_blank" rel="noopener noreferrer" className="site-btn site-btn--gold">
          <Globe size={18} aria-hidden="true" /> Explore portfolio
        </a>
        <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="site-btn site-btn--ghost">
          <GithubIcon size={18} /> GitHub
        </a>
      </PageHero>

      <section className="site-section" aria-labelledby="featured-title">
        <SectionTitle id="featured-title" kicker="Featured case study" title={featured.name} as="h2" />
        <article className="project-featured">
          <div>
            <p className="project-meta">
              <span>{featured.category}</span>
              <span className="status-pill status-pill--green">{featured.status}</span>
            </p>
            <p className="lead-text">{featured.description}</p>
            <ul className="check-list">
              {featured.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <ul className="tag-list" aria-label="Technologies">
              {featured.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <ProjectLinks p={featured} />
          </div>
          <ol className="ml-flow ml-flow--compact" aria-label="Project workflow">
            {["Raw data", "Clean + engineer", "Train & compare", "Evaluate (MAE, RMSE, R²)", "Predict yield"].map((s, i) => (
              <li key={s}>
                <span className="ml-flow-num" aria-hidden="true">
                  {i + 1}
                </span>
                <b>{s}</b>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="site-section" aria-labelledby="all-title">
        <SectionTitle id="all-title" kicker="More work" title="AI/ML and full-stack projects" />
        <div className="project-grid">
          {rest.map((p) => (
            <article key={p.id} className="project-card">
              <p className="project-meta">
                <span>{p.category}</span>
                <span className={`status-pill status-pill--${/prototype|learning/i.test(p.status) ? "gold" : "green"}`}>{p.status}</span>
              </p>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <ul className="check-list">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <ul className="tag-list" aria-label="Technologies">
                {p.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {p.githubNote && <p className="muted-note">{p.githubNote}</p>}
              <ProjectLinks p={p} />
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="verify-title">
        <h2 id="verify-title" className="visually-hidden">
          Verification notes
        </h2>
        <div className="doctor-note">
          <Info size={26} aria-hidden="true" />
          <div>
            <h3>How this list was verified</h3>
            <p>
              Project names, descriptions and technologies come from{" "}
              <a href={OWNER.portfolio} target="_blank" rel="noopener noreferrer">
                the portfolio
              </a>{" "}
              and public repository READMEs, checked on{" "}
              <time dateTime={PROJECTS_VERIFIED_ON}>
                {new Date(`${PROJECTS_VERIFIED_ON}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              . No results, metrics or live links have been added beyond those sources.
            </p>
            {UNVERIFIED_PROJECTS.map((u) => (
              <p key={u.name}>
                <b>{u.name}:</b> {u.reason}
              </p>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Like what you see?" text="Hire me for an AI/ML, data or full-stack role, or request a similar project." />
    </div>
  );
}
