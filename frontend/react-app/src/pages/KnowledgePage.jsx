import { useState } from "react";
import { Link } from "react-router";

import { MIcon } from "@/components/common/MIcon";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CROP_SEASONS, FARMING_SYSTEMS, FORMULAS, GLOSSARY, ML_APPLICATIONS, ML_STATUS, NUTRIENTS, PIPELINE, PRACTICES, YIELD_FACTORS,
} from "@/data/agronomy";
import { seasonInfo } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";
import { cropImage } from "@/lib/atlas";
import { G } from "@/lib/icons";

const SECTIONS = [
  { id: "pipeline", en: "ML pipeline", hi: "ML पाइपलाइन", icon: "psychology" },
  { id: "glossary", en: "Key terms", hi: "मुख्य शब्द", icon: "menu_book" },
  { id: "systems", en: "Farming systems", hi: "कृषि प्रणालियाँ", icon: "agriculture" },
  { id: "seasons", en: "Crop seasons", hi: "फसल मौसम", icon: "calendar_month" },
  { id: "nutrients", en: "Soil nutrients", hi: "मृदा पोषक तत्व", icon: "compost" },
  { id: "factors", en: "Yield factors", hi: "उपज के कारक", icon: "tune" },
  { id: "practices", en: "Field practices", hi: "खेती की विधियाँ", icon: "eco" },
  { id: "formulas", en: "Formulas", hi: "सूत्र", icon: "calculate" },
  { id: "ai", en: "AI in agriculture", hi: "कृषि में AI", icon: "auto_awesome" },
];

function Section({ id, hi, children }) {
  const meta = SECTIONS.find((s) => s.id === id);
  return (
    <section id={id} className="kb-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}><MIcon name={meta.icon} size={24} fill /> {hi ? meta.hi : meta.en}</h2>
      {children}
    </section>
  );
}

function Calculator({ formula }) {
  const [values, setValues] = useState(() => Object.fromEntries(formula.inputs.map((i) => [i.key, i.value])));
  const result = formula.compute(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])));
  return (
    <div className="kb-calc">
      <h3>{formula.name}</h3>
      <code>{formula.formula}</code>
      {formula.inputs.map((i) => (
        <label key={i.key} className="field-label">
          <span>{i.label}</span>
          <input type="number" min="0" step={i.step ?? "any"} value={values[i.key]} onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))} />
        </label>
      ))}
      <p className="kb-result" aria-live="polite">{result == null ? "—" : `${result.toLocaleString("en-IN")} ${formula.unit}`}</p>
    </div>
  );
}

/** Agronomy reference: terms, systems, seasons, nutrients, practices, formulas and how AI is used. */
export default function KnowledgePage() {
  const { lang } = useT();
  const hi = lang === "hi";

  return (
    <>
      <PageHeader page="learn" icon="menu_book" color={G.green} />
      <nav className="kb-toc" aria-label={hi ? "इस पृष्ठ पर" : "On this page"}>
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="chip"><MIcon name={s.icon} size={18} /> {hi ? s.hi : s.en}</a>)}
      </nav>

      <Section id="pipeline" hi={hi}>
        <p className="muted">{hi ? "यह परियोजना कच्चे डेटा से किसान की सलाह तक कैसे पहुँचती है।" : "How this project goes from raw data to advice a farmer can act on."}</p>
        <ol className="kb-pipeline">
          {PIPELINE.map((p, i) => (
            <li key={p.title}>
              <span className="kb-step-no">{i + 1}</span>
              <MIcon name={p.icon} size={26} fill className="kb-step-icon" />
              <b>{hi ? p.hi : p.title}</b>
              <small>{p.text}</small>
              {p.link ? <Link to={p.link.to} className="text-link">{p.link.label} →</Link> : <code>{p.code}</code>}
            </li>
          ))}
        </ol>
      </Section>

      <Section id="glossary" hi={hi}>
        <dl className="kb-glossary">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt>{g.term} <span className="muted">· {g.hi}</span></dt>
              <dd>
                {g.text}
                {g.example && <small>{hi ? "उदाहरण" : "Example"}: {g.example}</small>}
                {g.link && <Link to={g.link} className="text-link">{hi ? "उपकरण खोलें" : "Open tool"} →</Link>}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="systems" hi={hi}>
        <div className="table-responsive">
          <table className="table data-table">
            <thead><tr><th scope="col">{hi ? "प्रणाली" : "System"}</th><th scope="col">{hi ? "मुख्य विशेषता" : "Key feature"}</th><th scope="col">{hi ? "भारत में उदाहरण" : "Example in India"}</th></tr></thead>
            <tbody>
              {FARMING_SYSTEMS.map((s) => (
                <tr key={s.name}><th scope="row">{s.name}<br /><small className="muted">{s.hi}</small></th><td>{s.feature}</td><td>{s.example}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="seasons" hi={hi}>
        <div className="kb-seasons">
          {CROP_SEASONS.map((s) => {
            const info = seasonInfo(s.season);
            return (
              <article key={s.season} className="kb-season" style={{ "--c": info.color }}>
                <img src={s.image} alt={`${s.season} season fields`} loading="lazy" width="640" height="320" />
                <div className="kb-season-body">
                  <h3>{s.season} <span className="muted">· {info.hi}</span></h3>
                  <p className="muted">{s.note}</p>
                  <dl className="crop-facts">
                    <div><dt>{hi ? "बुवाई" : "Sowing"}</dt><dd>{s.sowing}</dd></div>
                    <div><dt>{hi ? "कटाई" : "Harvest"}</dt><dd>{s.harvest}</dd></div>
                  </dl>
                  <ul className="kb-crop-row">
                    {s.crops.map((c) => (
                      <li key={c}>
                        {cropImage(c) ? <img src={cropImage(c)} alt="" width="56" height="56" loading="lazy" /> : <MIcon name="eco" size={28} fill />}
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
        <p className="disclaimer">{hi ? "समय क्षेत्र और स्थानीय जलवायु के अनुसार बदलता है।" : "Periods vary by region and local climate."}</p>
      </Section>

      <Section id="nutrients" hi={hi}>
        <p className="muted">{hi ? "NPK = नाइट्रोजन + फॉस्फोरस + पोटैशियम" : "NPK = Nitrogen + Phosphorus + Potassium — the primary nutrients."}</p>
        <div className="kb-nutrients">
          {NUTRIENTS.map((n) => (
            <article key={n.symbol} className="kb-nutrient">
              <span className={`kb-symbol is-${n.group.toLowerCase()}`}>{n.symbol}</span>
              <div>
                <h3>{n.name} <span className="muted">· {n.hi}</span></h3>
                <small className="muted">{n.group}</small>
                <p>{n.role}</p>
                <p><b>{hi ? "कमी के लक्षण:" : "Deficiency:"}</b> {n.deficiency}</p>
                <p><b>{hi ? "स्रोत:" : "Sources:"}</b> {n.sources}</p>
              </div>
            </article>
          ))}
        </div>
        <Link to="/soil-analysis" className="btn btn-tonal btn-sm"><MIcon name="science" size={18} /> {hi ? "मृदा स्वास्थ्य जाँचें" : "Check your soil health"}</Link>
      </Section>

      <Section id="factors" hi={hi}>
        <div className="kb-factors">
          {YIELD_FACTORS.map((f) => (
            <article key={f.group} className="kb-factor">
              <h3><MIcon name={f.icon} size={22} fill /> {f.group}</h3>
              <ul>{f.items.map((i) => <li key={i}>{i}</li>)}</ul>
              {f.link && <Link to={f.link} className="text-link">{hi ? "संबंधित उपकरण" : "Related tool"} →</Link>}
            </article>
          ))}
        </div>
      </Section>

      <Section id="practices" hi={hi}>
        <ol className="kb-practices">
          {PRACTICES.map((p) => (
            <li key={p.step}>
              <b>{p.step}</b>
              <span>{p.tip}</span>
              {p.link && <Link to={p.link} className="text-link">{hi ? "उपकरण" : "Tool"} →</Link>}
            </li>
          ))}
        </ol>
      </Section>

      <Section id="formulas" hi={hi}>
        <p className="muted">{hi ? "मान बदलें — परिणाम तुरंत दिखेगा।" : "Change the values — results update instantly."}</p>
        <div className="kb-calcs">{FORMULAS.map((f) => <Calculator key={f.id} formula={f} />)}</div>
      </Section>

      <Section id="ai" hi={hi}>
        <div className="table-responsive">
          <table className="table data-table">
            <thead>
              <tr>
                <th scope="col">{hi ? "उपयोग" : "Application"}</th>
                <th scope="col">{hi ? "ML तकनीकें" : "ML techniques"}</th>
                <th scope="col">{hi ? "इस ऐप में" : "In this app"}</th>
              </tr>
            </thead>
            <tbody>
              {ML_APPLICATIONS.map((a) => {
                const status = ML_STATUS[a.status];
                return (
                  <tr key={a.task}>
                    <th scope="row">{a.link ? <Link to={a.link}>{a.task}</Link> : a.task}</th>
                    <td>{a.methods}</td>
                    <td><span className={`ml-status is-${status.tone}`}>{hi ? status.hi : status.label}</span> {a.here}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
