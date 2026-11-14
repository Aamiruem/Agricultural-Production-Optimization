import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Rocket,
  Tractor,
  TrendingUp,
} from "lucide-react";

import { CtaBand, PageHero, SectionTitle, WhatsAppButton } from "@/components/site/SiteKit";
import { SERVICE_STATUS, SERVICES } from "@/data/content/services";

const ICONS = { Tractor, BrainCircuit, TrendingUp, Cpu, BarChart3, Code2, Rocket, Briefcase };

export default function ServicesPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Services"
        title="Agricultural Technology, AI/ML and Software Services"
        lead="Practical technology for farms, agri-businesses, startups and individuals — built by AgriSmart's developer, Aamir Hussain Azad. Each service shows whether it is available today or planned."
        image="machines/crop-sensors"
        imageAlt="A soil-moisture sensor installed in a field"
      >
        <WhatsAppButton
          text="Hello Aamir, I'd like to discuss a project from the AgriSmart services page."
          label="Discuss a project"
        />
      </PageHero>

      <section className="site-section" aria-labelledby="legend-title">
        <h2 id="legend-title" className="visually-hidden">
          Service availability legend
        </h2>
        <ul className="status-legend">
          {Object.entries(SERVICE_STATUS).map(([key, s]) => (
            <li key={key}>
              <span className={`status-pill status-pill--${s.tone}`}>{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-labelledby="services-title">
        <SectionTitle id="services-title" kicker="What I offer" title="Services" />
        <div className="service-grid">
          {SERVICES.map((s) => {
            const Icon = ICONS[s.icon] ?? Code2;
            const status = SERVICE_STATUS[s.status];
            return (
              <article key={s.id} className={`service-card service-card--${s.status}`}>
                <header>
                  <span className="ai-icon" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <span className={`status-pill status-pill--${status.tone}`}>
                    {s.status === "available" ? (
                      <CheckCircle2 size={14} aria-hidden="true" />
                    ) : (
                      <Clock size={14} aria-hidden="true" />
                    )}
                    {status.label}
                  </span>
                </header>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <ul>
                  {s.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="muted-note">
          No prices or delivery promises are listed here: scope, timeline and cost are agreed for each project after a
          short conversation.
        </p>
      </section>

      <section className="site-section" aria-labelledby="process-title">
        <SectionTitle id="process-title" kicker="How we work" title="A simple four-step process" align="center" />
        <ol className="chain-flow chain-flow--4">
          <li>
            <span aria-hidden="true">1</span>
            <b>Talk</b>
            <small>Share your goal on WhatsApp, phone or email.</small>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <b>Scope</b>
            <small>Agree features, data, timeline and budget.</small>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <b>Build</b>
            <small>Regular demos while the solution is developed.</small>
          </li>
          <li>
            <span aria-hidden="true">4</span>
            <b>Launch</b>
            <small>Deployment, handover and support.</small>
          </li>
        </ol>
      </section>

      <CtaBand
        title="Ready to start?"
        text="Tell me about your farm, business or idea — I usually reply within a day."
      />
    </div>
  );
}
