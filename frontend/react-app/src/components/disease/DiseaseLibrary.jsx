import { useMemo, useState } from "react";

import { MIcon } from "@/components/common/MIcon";
import { DISEASE_CROPS, DISEASE_TYPES, SEASON_ORDER, filterDiseases } from "@/data/diseases";
import { STATES, seasonInfo } from "@/data/indiaAgri";

import { DiseaseCard } from "./DiseaseCard";

/** Browse crop-health problems by state, season, crop and type. */
export function DiseaseLibrary({ hi, initialState = "", initialSeason = "" }) {
  const [state, setState] = useState(initialState);
  const [season, setSeason] = useState(initialSeason);
  const [crop, setCrop] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterDiseases({ state, season, crop, type })
      .filter((d) => !q || `${d.en} ${d.hi} ${d.pathogen} ${d.crops.join(" ")}`.toLowerCase().includes(q))
      // problems specific to the chosen state first, nationwide ones after
      .sort((a, b) => Number(b.states.includes(state)) - Number(a.states.includes(state)));
  }, [state, season, crop, type, query]);

  const reset = () => { setState(""); setSeason(""); setCrop(""); setType(""); setQuery(""); };

  return (
    <section className="disease-library" aria-labelledby="disease-library-title">
      <div className="panel-head">
        <h2 id="disease-library-title"><MIcon name="map" size={24} fill /> {hi ? "क्षेत्र-वार रोग और कीट पुस्तकालय" : "Diseases & pests by region"}</h2>
        <p className="muted">
          {hi
            ? "अपना राज्य और मौसम चुनें — वहाँ आम समस्याएँ, पहचान के लक्षण और प्रबंधन देखें।"
            : "Pick your state and season to see the problems common there, how to recognise them and how to manage them."}
        </p>
      </div>
      <div className="filter-bar">
        <label className="search-input grow">
          <MIcon name="search" size={20} />
          <input placeholder={hi ? "रोग, कीट या फसल खोजें" : "Search disease, pest or crop"} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select aria-label={hi ? "राज्य" : "State"} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">{hi ? "पूरा भारत" : "All India"}</option>
          {STATES.map((s) => <option key={s.name} value={s.name}>{hi ? s.hi : s.name}</option>)}
        </select>
        <select aria-label={hi ? "मौसम" : "Season"} value={season} onChange={(e) => setSeason(e.target.value)}>
          <option value="">{hi ? "सभी मौसम" : "All seasons"}</option>
          {SEASON_ORDER.filter((s) => s !== "Year-round").map((s) => <option key={s} value={s}>{hi ? seasonInfo(s).hi : s}</option>)}
        </select>
        <select aria-label={hi ? "फसल" : "Crop"} value={crop} onChange={(e) => setCrop(e.target.value)}>
          <option value="">{hi ? "सभी फसलें" : "All crops"}</option>
          {DISEASE_CROPS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label={hi ? "प्रकार" : "Type"} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{hi ? "सभी प्रकार" : "All types"}</option>
          {DISEASE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span className="crop-count">{list.length} {hi ? "समस्याएँ" : "problems"}</span>
      </div>

      {list.length === 0 ? (
        <div className="crop-empty">
          {hi ? "इन फ़िल्टरों के लिए कोई समस्या नहीं मिली।" : "No problems match these filters."}{" "}
          <button type="button" className="btn btn-link btn-sm" onClick={reset}>{hi ? "फ़िल्टर हटाएँ" : "Clear filters"}</button>
        </div>
      ) : (
        <div className="disease-grid">{list.map((d) => <DiseaseCard key={d.id} disease={d} state={state} hi={hi} />)}</div>
      )}
      <p className="disclaimer">
        {hi
          ? "क्षेत्र ICAR और राज्य कृषि विभाग की रिपोर्ट पर आधारित ऐतिहासिक हॉटस्पॉट हैं, लाइव प्रकोप नहीं। छिड़काव से पहले अपने KVK से पुष्टि करें।"
          : "Regions are historical hotspots from ICAR and state agriculture department reports, not live outbreaks. Confirm with your KVK before spraying. Photos show the affected crop, not the symptom."}
      </p>
    </section>
  );
}
