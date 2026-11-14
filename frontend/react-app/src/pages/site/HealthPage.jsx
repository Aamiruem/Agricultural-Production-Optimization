import {
  ArrowRight,
  BriefcaseMedical,
  ExternalLink,
  GlassWater,
  HardHat,
  HeartHandshake,
  Hospital,
  Phone,
  Salad,
  ShieldCheck,
  SprayCan,
  Stethoscope,
  ThermometerSun,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router";

import { MedicalDisclaimer } from "@/components/site/MedicalDisclaimer";
import { CtaBand, PageHero, Reviewed, SectionTitle, SitePhoto } from "@/components/site/SiteKit";
import { HEALTH_GALLERY, HEALTH_RESOURCES, HEALTH_TOPICS, HELPLINES } from "@/data/content/health";
import { BRAND, mailtoLink } from "@/data/site";

const ICONS = { Stethoscope, Hospital, ShieldCheck, Salad, BriefcaseMedical, GlassWater, HardHat, ThermometerSun, SprayCan, HeartHandshake };

export default function HealthPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Healthcare & farmer well-being"
        title="Health and Safety for Farming Communities"
        lead="Practical health information for farmers and rural families: finding a qualified doctor, preventive care, first aid, clean water, heat stress, pesticide safety and mental wellness."
        image="health/doctor-consultation"
        imageAlt="A doctor examining a patient with a stethoscope"
      >
        <a href="#helplines" className="site-btn site-btn--gold">
          Emergency helplines <ArrowRight size={18} aria-hidden="true" />
        </a>
        <a href="#topics" className="site-btn site-btn--ghost">
          Health topics
        </a>
      </PageHero>

      <div className="site-section">
        <MedicalDisclaimer />
      </div>

      <section className="site-section" id="helplines" aria-labelledby="helplines-title">
        <SectionTitle id="helplines-title" kicker="Help now" title="Emergency and support helplines (India)" />
        <ul className="helpline-grid">
          {HELPLINES.map((h) => (
            <li key={h.number}>
              <a href={`tel:${h.number.replace(/-/g, "")}`}>
                <Phone size={18} aria-hidden="true" />
                <b>{h.number}</b>
                <small>{h.label}</small>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" id="doctors" aria-labelledby="doctors-title">
        <SectionTitle
          id="doctors-title"
          kicker="Doctors & healthcare professionals"
          title="Find and verify a qualified doctor"
          lead="Always consult a registered medical practitioner. Use these official government services to find care and confirm a doctor's registration."
        />
        <div className="resource-grid">
          {HEALTH_RESOURCES.map((r) => (
            <a key={r.href} href={r.href} className="resource-card" target="_blank" rel="noopener noreferrer">
              <b>{r.name}</b>
              <span>{r.text}</span>
              <small>
                Official website <ExternalLink size={14} aria-hidden="true" />
              </small>
            </a>
          ))}
        </div>
        <div className="doctor-note">
          <UserRoundCheck size={28} aria-hidden="true" />
          <div>
            <h3>Doctor profiles</h3>
            <p>
              AgriSmart lists doctors only after their registration and details are verified. No profiles have been
              verified yet, so none are shown — we will not publish invented names, qualifications, hospitals or phone
              numbers. Registered doctors who would like to share rural health guidance can{" "}
              <a href={mailtoLink("Doctor listing on AgriSmart", "Name:\nNMC/State registration number:\nQualification:\nClinic/hospital:\n")}>
                contact us by email
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="gallery-title">
        <SectionTitle id="gallery-title" kicker="Rural healthcare" title="Healthcare close to farming communities" />
        <div className="photo-grid photo-grid--5">
          {HEALTH_GALLERY.map((g) => (
            <figure key={g.image} className="photo-tile">
              <SitePhoto image={g.image} alt={g.alt} sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 20vw" />
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="site-section" id="topics" aria-labelledby="topics-title">
        <SectionTitle id="topics-title" kicker="Health awareness" title="Health topics for farmers and rural families" />
        <div className="health-grid">
          {HEALTH_TOPICS.map((t) => {
            const Icon = ICONS[t.icon] ?? Stethoscope;
            return (
              <article key={t.id} id={t.id} className={`health-card${t.image ? " health-card--photo" : ""}`}>
                {t.image && <SitePhoto image={t.image} alt={t.alt} sizes="(max-width: 768px) 100vw, 40vw" />}
                <div className="health-card-body">
                  <h3>
                    <span className="ai-icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    {t.title}
                  </h3>
                  <p>{t.summary}</p>
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
        <Reviewed date={BRAND.contentUpdated} />
        <MedicalDisclaimer />
      </section>

      <CtaBand title="Building a rural health or wellness tool?" text="AgriSmart's developer has built a mental-wellness scoring app and data dashboards. Get in touch." />
    </div>
  );
}
