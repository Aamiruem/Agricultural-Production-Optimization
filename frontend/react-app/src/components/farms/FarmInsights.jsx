import { Link } from "react-router";

import { IconBadge } from "@/components/common/IconBadge";
import { MIcon } from "@/components/common/MIcon";
import { SEASON_BY_ID, SOIL_BY_ID, STATE_BY_NAME } from "@/data/indiaAgri";
import { farmAdvisories, useWeather, weatherLabel } from "@/hooks/useWeather";
import { useT } from "@/i18n/useT";
import { currentSeason, farmCoords, recommendedFieldCrops, seasonalCropsFor } from "@/lib/farmIntel";
import { G } from "@/lib/icons";

/** Location intelligence for a farm (or a location being entered): climate, soils, season, weather. */
export function FarmInsights({ location, compact = false }) {
  const { lang } = useT();
  const hi = lang === "hi";
  const state = STATE_BY_NAME[location?.state];
  const coords = farmCoords(location);
  const weather = useWeather(coords);
  if (!state) {
    return (
      <div className="insight-empty">
        <MIcon name="location_on" size={28} fill />
        <span>{hi ? "राज्य चुनें — हम मिट्टी, मौसम और उपयुक्त फसलें दिखाएँगे।" : "Choose a state to see soils, climate, live weather and the best crops for this season."}</span>
      </div>
    );
  }
  const season = currentSeason();
  const s = SEASON_BY_ID[season];
  const picks = recommendedFieldCrops(state.name, season).slice(0, 6);
  const seasonal = seasonalCropsFor(state.name, season).slice(0, 10);
  const cur = weather.data?.current;
  const wl = cur ? weatherLabel(cur.weather_code, lang) : null;
  const advice = farmAdvisories(weather.data, lang).slice(0, 2);

  return (
    <section className={`farm-insights${compact ? " compact" : ""}`} aria-label="Farm insights">
      <div className="fi-head">
        <IconBadge icon="insights" color={G.purple} />
        <div>
          <h3>{hi ? "खेत की जानकारी" : "Farm intelligence"}</h3>
          <p>{[location.village, location.district, hi ? state.hi : state.name].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      <div className="fi-grid">
        <div className="fi-tile">
          <small>{hi ? "कृषि-जलवायु क्षेत्र" : "Agro-climatic zone"}</small>
          <b>{state.zone}</b>
          <span>≈ {state.rainfall.toLocaleString("en-IN")} mm {hi ? "वार्षिक वर्षा" : "normal rainfall"}</span>
        </div>
        <div className="fi-tile">
          <small>{hi ? "प्रमुख मिट्टी" : "Common soils"}</small>
          <div className="fi-soils">{state.soils.map((id) => <span key={id} style={{ "--c": SOIL_BY_ID[id].color }}><i />{hi ? SOIL_BY_ID[id].hi : SOIL_BY_ID[id].en}</span>)}</div>
        </div>
        <div className="fi-tile weatherish">
          <small>{hi ? "अभी का मौसम" : "Weather now"} · {coords.label}</small>
          {cur ? <b>{wl.icon} {Math.round(cur.temperature_2m)}°C <em>{wl.text} · 💧{cur.relative_humidity_2m}%</em></b> : <b>{weather.isError ? "—" : "…"}</b>}
          {!coords.precise && <span>{hi ? "सटीक मौसम के लिए GPS जोड़ें" : "Add GPS for field-level weather"}</span>}
        </div>
        <div className="fi-tile" style={{ "--c": s.color }}>
          <small>{hi ? "वर्तमान मौसम" : "Season now"}</small>
          <b className="season-name">{s.emoji} {hi ? s.hi : s.en}</b>
          <span>{hi ? s.monthsHi : s.months}</span>
        </div>
      </div>

      {!compact && advice.length > 0 && (
        <ul className="advisory-list fi-adv">{advice.map((a) => <li key={a.text} className={`adv-${a.level}`}><MIcon name={a.level === "good" ? "check_circle" : "info"} size={18} fill />{a.text}</li>)}</ul>
      )}

      {picks.length > 0 && (
        <div className="fi-picks">
          <h4><MIcon name="auto_awesome" size={18} fill /> {hi ? `इस ${s.hi} मौसम के लिए सुझाई गई फसलें` : `Suggested field crops for ${s.en}`}</h4>
          <div className="mini-crops">{picks.map((p) => <span key={p.crop} title={p.local ? "Grown widely in this state" : "Suited to the season"}><em>{p.emoji}</em>{hi ? p.labelHi : p.label}{p.local && <MIcon name="verified_user" size={14} fill className="fi-local" />}</span>)}</div>
        </div>
      )}
      {!compact && seasonal.length > 0 && (
        <p className="fi-more">{hi ? "इस मौसम में राज्य की अन्य फसलें: " : "Also grown here now: "}{seasonal.map((c) => (hi ? c.hi : c.en.split(" (")[0])).join(" · ")}</p>
      )}
      {!compact && (
        <div className="fi-actions">
          <Link to="/soil-analysis" className="btn btn-tonal btn-sm"><MIcon name="science" size={18} /> {hi ? "मिट्टी जाँच" : "Soil check"}</Link>
          <Link to="/weather" className="btn btn-outline btn-sm"><MIcon name="partly_cloudy_day" size={18} /> {hi ? "पूर्वानुमान" : "Forecast"}</Link>
          <Link to={`/states?state=${encodeURIComponent(state.name)}`} className="btn btn-outline btn-sm"><MIcon name="map" size={18} /> {hi ? "राज्य सलाहकार" : "State advisor"}</Link>
        </div>
      )}
    </section>
  );
}
