import { MIcon } from "@/components/common/MIcon";
import { seasonInfo } from "@/data/indiaAgri";
import { cropImage } from "@/lib/atlas";

const TYPE_ICON = {
  Fungal: "grass", Bacterial: "science", Viral: "pest_control", Oomycete: "water_drop", "Soil-borne": "landscape",
  "Insect pest": "pest_control", Nutrient: "compost", Abiotic: "wb_sunny",
};
const MAX_STATES = 6;

/** First affected crop that has a photo in the crop library. */
function photoFor(disease) {
  for (const crop of disease.crops) {
    const src = crop !== "*" && cropImage(crop);
    if (src) return { src, crop };
  }
  return null;
}

function Regions({ states, highlight, hi }) {
  if (states.includes("*")) return <span>{hi ? "पूरे भारत में" : "All over India"}</span>;
  const shown = states.slice(0, MAX_STATES);
  const more = states.length - shown.length;
  return (
    <span className="region-list">
      {shown.map((s) => <span key={s} className={s === highlight ? "is-here" : undefined}>{s}</span>)}
      {more > 0 && <span title={states.slice(MAX_STATES).join(", ")}>+{more} {hi ? "और" : "more"}</span>}
    </span>
  );
}

/** One crop-health problem: photo of the affected crop, where/when it strikes, how to manage it. */
export function DiseaseCard({ disease: d, state, hi }) {
  const photo = photoFor(d);
  const localHotspot = state && d.states.includes(state);
  return (
    <article className="disease-card">
      <div className="disease-photo">
        {photo
          ? <img src={photo.src} alt={`${photo.crop} crop`} loading="lazy" width="480" height="270" />
          : <MIcon name={TYPE_ICON[d.type] ?? "pest_control"} size={48} fill />}
        <span className="disease-type"><MIcon name={TYPE_ICON[d.type] ?? "pest_control"} size={16} fill /> {d.type}</span>
        {localHotspot && <span className="disease-hotspot"><MIcon name="location_on" size={16} fill /> {hi ? "आपके राज्य में आम" : `Common in ${state}`}</span>}
      </div>
      <div className="disease-body">
        <h3>{hi ? d.hi : d.en}</h3>
        <p className="disease-sub">{hi ? d.en : d.hi}{d.pathogen !== "—" && <> · <i>{d.pathogen}</i></>}</p>
        <div className="season-tags">
          {d.seasons.map((s) => <span key={s} style={{ "--c": seasonInfo(s).color }}>{hi ? seasonInfo(s).hi : s}</span>)}
        </div>
        <dl className="disease-facts">
          <div><dt>{hi ? "फसलें" : "Crops"}</dt><dd>{d.crops.includes("*") ? (hi ? "कोई भी फसल" : "Any crop") : d.crops.join(", ")}</dd></div>
          <div><dt>{hi ? "कहाँ" : "Where"}</dt><dd><Regions states={d.states} highlight={state} hi={hi} /></dd></div>
        </dl>
        <p className="disease-signs"><b>{hi ? "पहचान:" : "Look for:"}</b> {d.signs}</p>
        <details>
          <summary>{hi ? "कारण और प्रबंधन" : "Conditions, spread & management"}</summary>
          <p><b>{hi ? "अनुकूल परिस्थितियाँ:" : "Favoured by:"}</b> {d.conditions}</p>
          <p><b>{hi ? "फैलाव:" : "Spreads by:"}</b> {d.spread}</p>
          <ul>{d.care.map((c) => <li key={c}>{c}</li>)}</ul>
        </details>
      </div>
    </article>
  );
}
