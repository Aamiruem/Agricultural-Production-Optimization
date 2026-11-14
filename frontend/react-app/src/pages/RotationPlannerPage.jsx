import { useMemo, useState } from "react";

import { MIcon } from "@/components/common/MIcon";
import { PageHeader } from "@/components/common/PageHeader";
import { useT } from "@/i18n/useT";
import {
  ADVISOR_SEASONS,
  ATLAS_SOILS,
  ROTATION_PREVIOUS,
  advisorSeason,
  atlasCrop,
  recommendRotation,
} from "@/lib/atlas";
import { G } from "@/lib/icons";

/** Suggest the next crop after a harvest, favouring legume breaks and soil fit. */
export default function RotationPlannerPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const [previous, setPrevious] = useState("Rice");
  const [season, setSeason] = useState(advisorSeason());
  const [soil, setSoil] = useState("Alluvial");
  const options = useMemo(() => recommendRotation({ previous, season, soil }), [previous, season, soil]);
  const prev = atlasCrop(previous);

  return (
    <>
      <PageHeader
        title={hi ? "फसल चक्र योजनाकार" : "Rotation planner"}
        description={
          hi
            ? "पिछली फसल के बाद अगली सर्वोत्तम फसल — मिट्टी स्वास्थ्य, पानी और रोग चक्र को ध्यान में रखकर।"
            : "Pick the next crop after a harvest to rebuild soil nitrogen, spread water use and break pest cycles."
        }
        icon="autorenew"
        color={G.teal}
      />
      <section className="tool-card">
        <div className="rotation-inputs">
          <label className="field-label">
            <span>{hi ? "पिछली फसल" : "Previous crop"}</span>
            <select value={previous} onChange={(e) => setPrevious(e.target.value)}>
              {ROTATION_PREVIOUS.map((c) => (
                <option key={c} value={c}>
                  {c} · {atlasCrop(c)?.hi}
                </option>
              ))}
            </select>
          </label>
          <div className="field-label" role="group">
            <span>{hi ? "अगला मौसम" : "Next season"}</span>
            <div className="seg">
              {ADVISOR_SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={season === s ? "on" : ""}
                  aria-pressed={season === s}
                  onClick={() => setSeason(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label className="field-label">
            <span>{hi ? "मिट्टी" : "Soil"}</span>
            <select value={soil} onChange={(e) => setSoil(e.target.value)}>
              {ATLAS_SOILS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.hi}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="rotation-flow">
        <div className="rotation-from">
          {prev && <img src={prev.image} alt="" width="120" height="120" />}
          <b>{previous}</b>
          <small>{hi ? "पिछली फसल" : "Harvested"}</small>
        </div>
        <MIcon name="arrow_forward" size={36} className="rotation-arrow" />
        <div className="rotation-options">
          {options.map((o, i) => {
            const next = atlasCrop(o.next);
            return (
              <article key={o.next} className={`rotation-card${i === 0 ? " best" : ""}`}>
                {next && <img src={next.image} alt="" width="96" height="96" loading="lazy" />}
                <div>
                  <div className="d-flex justify-content-between gap-2 align-items-start">
                    <b>
                      {i === 0 && "★ "}
                      {o.next} · {next?.hi}
                    </b>
                    <span className="advisor-score">{o.total}</span>
                  </div>
                  <p>{o.reason}</p>
                  <div className="d-flex flex-wrap gap-1">
                    <span className={`chip small${o.seasonMatch ? " on" : ""}`}>{o.season}</span>
                    <span className={`chip small${o.soilMatch ? " on" : ""}`}>{o.soil}</span>
                    {o.fallback && <span className="chip small">{hi ? "सामान्य विकल्प" : "general option"}</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <p className="disclaimer">
        Score = rotation-guide base score + 6 if the season matches + 4 if the soil matches. "General option" entries
        are lower-confidence fallbacks when the guide has fewer than three matches for this crop.
      </p>
    </>
  );
}
