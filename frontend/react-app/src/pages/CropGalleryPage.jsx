import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { MIcon } from "@/components/common/MIcon";
import { PageHeader } from "@/components/common/PageHeader";
import { useT } from "@/i18n/useT";
import { ADVISOR_SEASONS, ATLAS_CROPS, CROP_GROUPS } from "@/lib/atlas";
import { G } from "@/lib/icons";

const SEASON_HI = { Kharif: "खरीफ", Rabi: "रबी", Zaid: "ज़ायद", "Whole Year": "पूरे वर्ष", Perennial: "बारहमासी" };
const SEASON_COLOR = { Kharif: "#188038", Rabi: "#1a73e8", Zaid: "#e8710a", "Whole Year": "#9334e6", Perennial: "#9334e6" };
const WATER_HI = { Low: "कम", Medium: "मध्यम", High: "अधिक" };

/** Photo library of 45 Indian crops with bilingual names and growing guidance. */
export default function CropGalleryPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const [group, setGroup] = useState("");
  const [season, setSeason] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  // Escape closes the detail dialog.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const list = useMemo(() => ATLAS_CROPS.filter((c) =>
    (!group || c.group === group) && (!season || c.seasons.includes(season))
    && `${c.name} ${c.hi}`.toLowerCase().includes(query.trim().toLowerCase())), [group, season, query]);

  return (
    <>
      <PageHeader
        title={hi ? "फसल चित्र पुस्तकालय" : "Crop gallery"}
        description={hi ? "45 भारतीय फसलें — चित्र, हिंदी-अंग्रेज़ी नाम, मौसम, मिट्टी, पानी, तापमान और वर्षा।" : "45 Indian crops with photos, Hindi–English names, season, soil, water, temperature and rainfall guidance."}
        icon="photo_library" color={G.pink}
      />
      <div className="filter-bar">
        <label className="search-input grow"><MIcon name="search" size={20} /><input placeholder={hi ? "फसल खोजें (हिंदी या English)" : "Search crop (English or हिंदी)"} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search crops" /></label>
        <select aria-label="Crop group" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">{hi ? "सभी समूह" : "All groups"}</option>
          {CROP_GROUPS.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select aria-label="Season" value={season} onChange={(e) => setSeason(e.target.value)}>
          <option value="">{hi ? "सभी मौसम" : "All seasons"}</option>
          {[...ADVISOR_SEASONS, "Whole Year", "Perennial"].map((s) => <option key={s} value={s}>{hi ? SEASON_HI[s] : s}</option>)}
        </select>
        <span className="crop-count">{list.length} {hi ? "फसलें" : "crops"}</span>
      </div>

      {list.length === 0 && <div className="crop-empty">{hi ? "कोई फसल नहीं मिली।" : "No crops match these filters."}</div>}
      <div className="gallery-grid">
        {list.map((c) => (
          <button type="button" key={c.name} className="gallery-card" onClick={() => setOpen(c)} aria-label={`${c.name} details`}>
            <img src={c.image} alt={`${c.name} crop`} loading="lazy" width="480" height="480" />
            <span className="gallery-group">{c.group}</span>
            <span className="gallery-body">
              <b>{hi ? c.hi : c.name}</b>
              <small>{hi ? c.name : c.hi}</small>
              <span className="season-tags">{c.seasons.map((s) => <span key={s} style={{ "--c": SEASON_COLOR[s] }}>{hi ? SEASON_HI[s] : s}</span>)}</span>
            </span>
          </button>
        ))}
      </div>

      {open && (
        <div className="g-dialog-scrim" role="presentation" onClick={() => setOpen(null)}>
          <div className="g-dialog" role="dialog" aria-modal="true" aria-label={open.name} onClick={(e) => e.stopPropagation()}>
            <img src={open.image} alt={`${open.name} crop`} />
            <div className="g-dialog-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div><h2>{open.name} · {open.hi}</h2><p className="muted mb-0">{open.group}</p></div>
                <button type="button" className="icon-btn" onClick={() => setOpen(null)} aria-label="Close"><MIcon name="close" /></button>
              </div>
              <dl className="crop-facts">
                <div><dt>{hi ? "मौसम" : "Seasons"}</dt><dd>{open.seasons.map((s) => (hi ? SEASON_HI[s] : s)).join(", ")}</dd></div>
                <div><dt>{hi ? "उपयुक्त मिट्टी" : "Suitable soils"}</dt><dd>{open.soils.join(", ")}</dd></div>
                <div><dt>{hi ? "पानी की ज़रूरत" : "Water need"}</dt><dd>{hi ? WATER_HI[open.water] : open.water}</dd></div>
                <div><dt>{hi ? "उत्तम तापमान" : "Optimum temperature"}</dt><dd>{open.temp} °C</dd></div>
                <div><dt>{hi ? "उत्तम वर्षा" : "Optimum rainfall"}</dt><dd>{open.rain.toLocaleString("en-IN")} mm/yr</dd></div>
                <div><dt>{hi ? "संदर्भ उपज" : "Reference yield"}</dt><dd>{open.yield} t/ha</dd></div>
              </dl>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/seasonal-advisor" className="btn btn-tonal btn-sm"><MIcon name="tips_and_updates" size={18} /> {hi ? "मौसमी सलाहकार" : "Seasonal advisor"}</Link>
                <Link to="/yield-prediction" className="btn btn-outline btn-sm"><MIcon name="trending_up" size={18} /> {hi ? "उपज अनुमान" : "Predict yield"}</Link>
                <Link to={`/crops?query=${encodeURIComponent(open.name)}`} className="btn btn-outline btn-sm"><MIcon name="nutrition" size={18} /> {hi ? "फसल पुस्तकालय" : "Crop library"}</Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="disclaimer">{hi ? "संदर्भ मान सामान्य योजना हेतु हैं; किस्म और स्थान के अनुसार बदलते हैं।" : "Reference values are general planning figures and vary by variety and location."}</p>
    </>
  );
}
