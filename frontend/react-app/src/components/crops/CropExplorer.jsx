import { Droplets, MapPin, Search, Timer } from "lucide-react";
import { useMemo } from "react";

import { CATEGORIES, CATEGORY_BY_ID, CROPS, SEASONS, SEASON_BY_ID, SOIL_TYPES, STATES } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";

const WATER = { low: ["Low water", "कम पानी", 1], medium: ["Medium water", "मध्यम पानी", 2], high: ["High water", "अधिक पानी", 3] };

/**
 * Filterable India crop catalogue. Categories are shown as separate sections
 * (grains, pulses, oilseeds, fruits, vegetables, dry fruits, spices, cash crops).
 * `filters` = { query, category, state, season, soil } with a matching `onChange(key, value)`.
 */
export function CropExplorer({ filters, onChange }) {
  const { t, lang } = useT();
  const hi = lang === "hi";
  const { query, category, state, season, soil } = filters;
  const filtered = useMemo(() => CROPS.filter((c) =>
    (!category || c.category === category) && (!state || c.states.includes(state)) && (!season || c.seasons.includes(season))
    && (!soil || c.soils.includes(soil)) && `${c.en} ${c.hi} ${c.id}`.toLowerCase().includes(query.toLowerCase())), [query, category, state, season, soil]);
  const groups = CATEGORIES.map((cat) => ({ cat, crops: filtered.filter((c) => c.category === cat.id) })).filter((g) => g.crops.length);

  return (
    <section className="crop-explorer">
      <div className="category-tabs" role="tablist" aria-label={t("common.allCategories")}>
        <button role="tab" aria-selected={!category} className={!category ? "on" : ""} onClick={() => onChange("category", "")}>🌏 {t("common.allCategories")} <b>{CROPS.length}</b></button>
        {CATEGORIES.map((cat) => (
          <button key={cat.id} role="tab" aria-selected={category === cat.id} className={category === cat.id ? "on" : ""} style={{ "--c": cat.color, "--bg": cat.bg }} onClick={() => onChange("category", cat.id)}>
            {cat.emoji} {hi ? cat.hi : cat.en} <b>{CROPS.filter((c) => c.category === cat.id).length}</b>
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <label className="search-input grow"><Search size={16} /><input placeholder={hi ? "फसल खोजें (हिंदी या English)" : "Search crop (English or हिंदी)"} value={query} onChange={(e) => onChange("query", e.target.value)} aria-label={t("common.search")} /></label>
        <select aria-label={t("common.state")} value={state} onChange={(e) => onChange("state", e.target.value)}>
          <option value="">{t("common.allIndia")}</option>
          {STATES.map((s) => <option key={s.name} value={s.name}>{hi ? s.hi : s.name}</option>)}
        </select>
        <select aria-label={t("common.season")} value={season} onChange={(e) => onChange("season", e.target.value)}>
          <option value="">{t("common.allSeasons")}</option>
          {SEASONS.map((s) => <option key={s.id} value={s.id}>{s.emoji} {hi ? s.hi : s.en} ({hi ? s.monthsHi : s.months})</option>)}
        </select>
        <select aria-label={t("common.soil")} value={soil} onChange={(e) => onChange("soil", e.target.value)}>
          <option value="">{t("common.allSoils")}</option>
          {SOIL_TYPES.map((s) => <option key={s.id} value={s.id}>{hi ? s.hi : s.en}</option>)}
        </select>
        <span className="crop-count">{filtered.length} {hi ? "फसलें" : "crops"}</span>
      </div>

      {!groups.length && <div className="crop-empty">{hi ? "कोई फसल नहीं मिली। फ़िल्टर बदलें।" : "No crops match all filters. Clear one or more filters."}</div>}
      {groups.map(({ cat, crops }) => (
        <div key={cat.id} className="crop-group">
          <h2 className="crop-group-title" style={{ "--c": cat.color }}><span>{cat.emoji}</span>{hi ? cat.hi : cat.en}<small>{crops.length}</small></h2>
          <div className="crop-grid">
            {crops.map((c) => (
              <article key={c.id} className="crop-tile" style={{ "--c": CATEGORY_BY_ID[c.category].color, "--bg": CATEGORY_BY_ID[c.category].bg }}>
                <div className="crop-visual" aria-hidden="true">{c.emoji}</div>
                <div className="crop-info">
                  <h3>{hi ? c.hi : c.en}</h3>
                  <small className="crop-alt">{hi ? c.en : c.hi}</small>
                  <div className="season-tags">{c.seasons.map((s) => <span key={s} style={{ "--c": SEASON_BY_ID[s].color }}>{hi ? SEASON_BY_ID[s].hi : SEASON_BY_ID[s].en}</span>)}</div>
                  <p className="crop-meta"><span><Droplets size={13} /> {hi ? WATER[c.water][1] : WATER[c.water][0]}</span><span><Timer size={13} /> {c.duration}{/^\d/.test(c.duration) ? (hi ? " दिन" : " days") : ""}</span></p>
                  <p className="crop-meta soils"><span className="dots">{c.soils.map((s) => <i key={s} style={{ background: SOIL_TYPES.find((x) => x.id === s).color }} />)}</span>{c.soils.map((s) => (hi ? SOIL_TYPES.find((x) => x.id === s).hi : SOIL_TYPES.find((x) => x.id === s).en)).join(", ")}</p>
                  <p className="crop-meta"><MapPin size={13} /> {c.states.slice(0, 4).join(", ")}{c.states.length > 4 ? ` +${c.states.length - 4}` : ""}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
      <p className="disclaimer">{hi ? "यह सूची प्रमुख उत्पादक राज्यों और सामान्य मौसम/मिट्टी पर आधारित है; ज़िला-स्तरीय किस्मों के लिए अपने KVK से संपर्क करें।" : "Leading states, seasons and soils are representative guidance, not a district-level calendar. Check your KVK or state agriculture department for local varieties and sowing windows."}</p>
    </section>
  );
}
