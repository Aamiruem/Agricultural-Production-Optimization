import { ArrowRight, GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";

import { ContactActions, GithubIcon, LinkedinIcon, PageHero, SectionTitle } from "@/components/site/SiteKit";
import { OWNER } from "@/data/site";

const SKILL_GROUPS = [
  { title: "AI & machine learning", skills: ["Machine Learning", "Deep Learning", "Generative AI", "RAG", "AI Agents"] },
  { title: "Data science", skills: ["Python", "SQL", "NumPy", "Pandas", "Matplotlib", "Scikit-learn", "TensorFlow and Keras", "Data Analytics", "Power BI"] },
  { title: "Full-stack development", skills: ["FastAPI", "React.js", "JavaScript", "HTML and CSS"] },
];

export default function DeveloperPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="About the developer"
        title={OWNER.name}
        lead={`${OWNER.title} · ${OWNER.location}`}
        image="education/farmers-in-field"
        imageAlt="Farmers working together in a field"
        compact
      >
        <a href={OWNER.portfolio} target="_blank" rel="noopener noreferrer" className="site-btn site-btn--gold">
          View portfolio <ArrowRight size={18} aria-hidden="true" />
        </a>
        <Link to="/projects" className="site-btn site-btn--ghost">
          Projects
        </Link>
      </PageHero>

      <section className="site-section profile">
        <img
          src={OWNER.photo}
          alt={`Portrait of ${OWNER.name}`}
          width="256"
          height="256"
          className="profile-photo"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="profile-text">
          <h2>Professional introduction</h2>
          <blockquote>
            “I am passionate about Artificial Intelligence, Machine Learning, Data Science and Full-Stack Development. My
            goal is to build intelligent, scalable and impactful technology solutions that solve real-world problems,
            including challenges in agriculture, healthcare and sustainable development.”
          </blockquote>
          <p>
            AgriSmart grew out of Aamir&apos;s B.Tech major project — an end-to-end crop yield prediction system — and
            brings that work together with educational content and free tools for farmers.
          </p>
          <ul className="profile-facts">
            <li>
              <MapPin size={18} aria-hidden="true" /> {OWNER.location}
            </li>
            <li>
              <Phone size={18} aria-hidden="true" /> <a href={`tel:${OWNER.phone}`}>{OWNER.phoneDisplay}</a>
            </li>
            <li>
              <Mail size={18} aria-hidden="true" /> <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
            </li>
            <li>
              <GithubIcon /> <a href={OWNER.github} target="_blank" rel="noopener noreferrer">github.com/Aamiruem</a>
            </li>
            <li>
              <LinkedinIcon /> <a href={OWNER.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn profile</a>
            </li>
          </ul>
          <ContactActions compact />
        </div>
      </section>

      <section className="site-section" aria-labelledby="skills-title">
        <SectionTitle id="skills-title" kicker="Skills" title="Technical skills" />
        <div className="skill-groups">
          {SKILL_GROUPS.map((g) => (
            <div key={g.title} className="skill-group">
              <h3>{g.title}</h3>
              <ul className="tag-list tag-list--lg">
                {g.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="edu-title">
        <SectionTitle id="edu-title" kicker="Education" title="Education" />
        <div className="edu-timeline">
          <GraduationCap size={28} aria-hidden="true" />
          <div>
            <h3>{OWNER.education.degree}</h3>
            <p>
              {OWNER.education.school} · {OWNER.education.year}
            </p>
            <p className="muted-note">Final-year major project: Agricultural Production &amp; Crop Yield Prediction System.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
