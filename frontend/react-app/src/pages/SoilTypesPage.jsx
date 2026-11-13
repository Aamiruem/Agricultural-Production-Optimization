import { Mountain } from "lucide-react";
import { Link } from "react-router";

import { PageHeader } from "@/components/common/PageHeader";
import { CROPS, SOIL_TYPES } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";

export default function SoilTypesPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  return (
    <>
      <PageHeader title={hi ? "भारत की मिट्टी के प्रकार" : "Soil types of India"} description={hi ? "ICAR वर्गीकरण के अनुसार आठ प्रमुख मिट्टियाँ — गुण, राज्य, फसलें और प्रबंधन।" : "The eight major soil groups of India (ICAR classification): properties, states, suited crops and management."} icon={Mountain} color="#92400e" />
      <div className="soil-grid">
        {SOIL_TYPES.map((s) => (
          <article key={s.id} className="soil-card" style={{ "--c": s.color }}>
            <div className="soil-swatch" aria-hidden="true" />
            <div className="soil-body">
              <div className="soil-title"><h2>{hi ? s.hi : s.en}</h2><span className="chip">{s.share} {hi ? "क्षेत्र" : "of area"}</span></div>
              <dl>
                <dt>pH</dt><dd>{s.ph}</dd>
                <dt>{hi ? "बनावट" : "Texture"}</dt><dd>{s.texture}</dd>
                <dt>{hi ? "पोषक तत्व" : "Nutrients"}</dt><dd>{s.npk}</dd>
                <dt>{hi ? "राज्य" : "States"}</dt><dd>{s.states.join(", ")}</dd>
              </dl>
              <div className="mini-crops">{CROPS.filter((c) => c.soils.includes(s.id)).slice(0, 10).map((c) => <span key={c.id}><em>{c.emoji}</em>{hi ? c.hi : c.en}</span>)}</div>
              <ul className="tip-list">{s.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              <Link to={`/crops?soil=${s.id}`} className="small">{hi ? "इस मिट्टी की सभी फसलें →" : "All crops for this soil →"}</Link>
            </div>
          </article>
        ))}
      </div>
      <p className="disclaimer">Area shares are approximate national figures; soils vary within every district. A soil test is the only reliable guide for a specific field.</p>
    </>
  );
}
