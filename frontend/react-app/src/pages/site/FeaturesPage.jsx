import {
  ArrowRight,
  BookOpen,
  CloudRain,
  CloudSun,
  FileDown,
  FlaskConical,
  GitCompare,
  IndianRupee,
  Lightbulb,
  LocateFixed,
  Lock,
  Map,
  PenTool,
  Satellite,
  Sprout,
  Tractor,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { FEATURE_CATEGORIES, FEATURES, STATUS_LABEL } from "@/data/content/features";
import { photo } from "@/data/site";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSession } from "@/store/authStore";

const ICONS = {
  LocateFixed,
  Map,
  CloudSun,
  CloudRain,
  FlaskConical,
  Sprout,
  TrendingUp,
  GitCompare,
  PenTool,
  Lightbulb,
  Tractor,
  FileDown,
  BookOpen,
  Satellite,
  IndianRupee,
};

function FeatureCta({ f, signedIn }) {
  if (f.status === "soon") {
    return f.info ? (
      <Link to={f.info} className="btn-x btn-x--text">
        Learn about it <ArrowRight size={16} aria-hidden="true" />
      </Link>
    ) : null;
  }
  if (f.status === "public") {
    return (
      <Link to={f.info} className="btn-x btn-x--secondary btn-x--sm">
        Open guide <ArrowRight size={16} aria-hidden="true" />
      </Link>
    );
  }
  return signedIn ? (
    <Link to={f.tool} className="btn-x btn-x--primary btn-x--sm">
      Open tool <ArrowRight size={16} aria-hidden="true" />
    </Link>
  ) : (
    <Link to={`/login?next=${encodeURIComponent(f.tool)}`} className="btn-x btn-x--secondary btn-x--sm">
      <Lock size={15} aria-hidden="true" /> Sign in to use
    </Link>
  );
}

export default function FeaturesPage() {
  useDocumentTitle("Features", null);
  const { user } = useSession();
  const [cat, setCat] = useState("all");
  const list = FEATURES.filter((f) => cat === "all" || f.category === cat);
  const counts = {
    live: FEATURES.filter((f) => f.status !== "soon").length,
    soon: FEATURES.filter((f) => f.status === "soon").length,
  };

  return (
    <>
      <section className="hp-hero" aria-labelledby="feat-title">
        <div className="container-x">
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Features</span>
            <h1 id="feat-title" style={{ fontSize: "var(--fs-hero)", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              Everything AgriSmart can do
            </h1>
            <p>
              {counts.live} working features and {counts.soon} planned ones — each marked honestly. Knowledge guides are
              open to everyone; analysis tools need a free account.
            </p>
            {!user && (
              <div className="hp-cta-row">
                <Link to="/register" className="btn-x btn-x--primary">
                  Create a free account
                </Link>
                <Link to="/login" className="btn-x btn-x--secondary">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="sec sec--white" aria-label="Feature directory">
        <div className="container-x">
          <div className="filter-row" role="group" aria-label="Filter features by category">
            {FEATURE_CATEGORIES.map((c) => (
              <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="card-grid card-grid--3" id="data">
            {list.map((f) => {
              const Icon = ICONS[f.icon] ?? Sprout;
              const p = photo(f.image);
              return (
                <article key={f.id} id={f.id} className="feat-card" style={{ scrollMarginTop: "96px" }}>
                  <img
                    src={p.src}
                    srcSet={p.srcSet}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    width="1200"
                    height="800"
                    loading="lazy"
                    decoding="async"
                    alt=""
                  />
                  <div className="feat-body">
                    <div className="card-top">
                      <span className="ic" aria-hidden="true">
                        <Icon size={20} />
                      </span>
                      <span className={`status-tag status-tag--${f.status === "public" ? "live" : f.status}`}>
                        {STATUS_LABEL[f.status]}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, margin: 0 }}>{f.title}</h2>
                    <p className="feat-sub">{f.sub}</p>
                    <p>{f.text}</p>
                    <ul aria-label="Benefits">
                      {f.benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <FeatureCta f={f} signedIn={Boolean(user)} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
