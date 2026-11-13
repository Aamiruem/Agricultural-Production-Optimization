import { MapPin } from "lucide-react";
import { INDIA_CROPS } from "@/data/indiaCrops";

const INDIA_STATES=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"];
const SEASONS=["All seasons","Kharif","Rabi","Zaid","Whole Year","Summer","Winter","Tropical","Temperate"];
const SOILS=["All soil types","Alluvial","Black","Clay","Loam","Laterite","Red","Sandy"];

export function CropExplorer({category,setCategory,query,setQuery,state,setState,season,setSeason,soil,setSoil,filtered}) {
  const cats=["All crops",...new Set(INDIA_CROPS.map(c=>c[0]))];
  return <section className="tool-card crop-explorer"><div className="explorer-heading"><div><h2>India crop explorer</h2><p>Browse grains, oilseeds, fruits, vegetables, dry fruits, pulses and spices by region, season and soil.</p></div><span className="crop-count">{filtered.length} crops</span></div>
    <div className="explorer-controls crop-filter-grid"><input aria-label="Search crops" placeholder="Search crop, season, soil or state" value={query} onChange={e=>setQuery(e.target.value)}/>
      <select aria-label="Crop category" value={category} onChange={e=>setCategory(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select>
      <select aria-label="Indian state or union territory" value={state} onChange={e=>setState(e.target.value)}><option>All India</option>{INDIA_STATES.map(s=><option key={s}>{s}</option>)}</select>
      <select aria-label="Growing season" value={season} onChange={e=>setSeason(e.target.value)}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select>
      <select aria-label="Soil type" value={soil} onChange={e=>setSoil(e.target.value)}>{SOILS.map(s=><option key={s}>{s}</option>)}</select>
    </div>
    {filtered.length ? <div className="crop-grid">{filtered.map(c=><article className="crop-tile" key={c[1]}><span className="crop-emoji">{c[4]}</span><span className="crop-category">{c[0]}</span><h3>{c[1]}</h3><p>{c[2]}</p><small><MapPin size={13}/> {c[3]}</small></article>)}</div> : <div className="crop-empty">No catalogue entries match all selected filters. Clear one or more filters to browse the India-wide list.</div>}
    <p className="disclaimer">This curated catalogue gives representative growing guidance and leading-state examples, not an exhaustive district-level planting calendar. Check your state agriculture department or KVK for local varieties, sowing windows and soil recommendations.</p></section>;
}
