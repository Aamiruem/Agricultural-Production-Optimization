import { Award, CloudRain, Landmark, MapPinned, Mountain, Sprout } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { G } from "@/lib/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { StateSelect } from "@/components/common/StateSelect";
import analytics from "@/data/generated/analytics.json";
import { CATEGORIES, SOIL_BY_ID, STATES, STATE_BY_NAME, cropsForState, datasetStateName } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";
import { compact, useChartColors } from "@/lib/chartTheme";

export default function StatesPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const c = useChartColors();
  const [params, setParams] = useSearchParams();
  const name = STATE_BY_NAME[params.get("state")] ? params.get("state") : "Uttar Pradesh";
  const s = STATE_BY_NAME[name];
  const data = analytics.states[datasetStateName(name)];
  const top = (data?.top ?? []).slice(0, 8).map(([crop, area]) => ({ crop, area }));
  const catalogue = cropsForState(name);

  return (
    <>
      <PageHeader
        page="states"
        icon="map"
        color={G.teal}
        actions={<StateSelect value={name} onChange={(v) => setParams({ state: v })} />}
      />
      <div className="state-chips">
        {STATES.map((x) => (
          <button
            key={x.name}
            className={`chip${x.name === name ? " on" : ""}${x.type === "ut" ? " ut" : ""}`}
            onClick={() => setParams({ state: x.name })}
          >
            {hi ? x.hi : x.name}
          </button>
        ))}
      </div>

      <section className="state-hero">
        <div>
          <span className="chip">
            {s.type === "ut" ? (hi ? "केंद्र शासित प्रदेश" : "Union territory") : hi ? "राज्य" : "State"}
          </span>
          <h2>
            {hi ? s.hi : s.name} <small>{hi ? s.name : s.hi}</small>
          </h2>
          <div className="state-facts">
            <span>
              <Landmark size={16} /> {hi ? "राजधानी" : "Capital"}: <b>{s.capital}</b>
            </span>
            <span>
              <Mountain size={16} /> {hi ? "कृषि-जलवायु क्षेत्र" : "Agro-climatic zone"}: <b>{s.zone}</b>
            </span>
            <span>
              <CloudRain size={16} /> {hi ? "सामान्य वर्षा" : "Normal rainfall"}:{" "}
              <b>≈ {s.rainfall.toLocaleString("en-IN")} mm</b>
            </span>
          </div>
        </div>
        <div className="soil-badges">
          {s.soils.map((id) => (
            <span key={id} style={{ "--c": SOIL_BY_ID[id].color }}>
              <i />
              {hi ? SOIL_BY_ID[id].hi : SOIL_BY_ID[id].en}
            </span>
          ))}
        </div>
      </section>

      <div className="tool-columns three">
        <section className="tool-card season-card kharif">
          <h3>🌧️ {hi ? "खरीफ (जून–अक्टूबर)" : "Kharif (Jun–Oct)"}</h3>
          <div className="mini-crops">
            {s.kharif.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </section>
        <section className="tool-card season-card rabi">
          <h3>❄️ {hi ? "रबी (अक्टूबर–मार्च)" : "Rabi (Oct–Mar)"}</h3>
          <div className="mini-crops">
            {s.rabi.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </section>
        <section className="tool-card season-card horti">
          <h3>🍎 {hi ? "बागवानी और विशेष फसलें" : "Horticulture & specialties"}</h3>
          <div className="mini-crops">
            {s.horticulture.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </section>
      </div>

      <div className="tool-columns">
        <section className="tool-card">
          <h2>
            <Sprout size={18} className="text-success" />{" "}
            {hi ? "प्रमुख कृषि ज़िले और क्षेत्र" : "Key farming districts & regions"}
          </h2>
          <ul className="district-list">
            {s.districts.map(([d, note]) => (
              <li key={d}>
                <b>{d}</b>
                <span>{note}</span>
              </li>
            ))}
          </ul>
          {s.gi.length > 0 && (
            <>
              <h3 className="h6 mt-3">
                <Award size={16} className="text-warning" /> {hi ? "GI टैग उत्पाद" : "GI-tagged produce"}
              </h3>
              <div className="mini-crops">
                {s.gi.map((g) => (
                  <span key={g} className="gi">
                    🏅 {g}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
        <section className="tool-card">
          <h2>{hi ? "क्षेत्रफल के अनुसार शीर्ष फसलें" : "Top crops by area"}</h2>
          {top.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="crop"
                  stroke={c.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={120}
                />
                <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip format={compact} unit=" ha" />} />
                <Bar
                  dataKey="area"
                  name="Area"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                  label={{ position: "right", fill: c.text, fontSize: 11, formatter: compact }}
                >
                  {top.map((r, i) => (
                    <Cell key={r.crop} fill={c.series[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">
              {hi
                ? "इस क्षेत्र के लिए ऐतिहासिक डेटा उपलब्ध नहीं है।"
                : "No historical area records for this region in the bundled dataset."}
            </p>
          )}
          <p className="muted tiny">Average annual area, last 3 recorded years.</p>
        </section>
      </div>

      <section className="tool-card">
        <h2>{hi ? `${s.hi} में उगाई जाने वाली फसलें (श्रेणी-वार)` : `Crops grown in ${s.name}, by category`}</h2>
        <div className="cat-columns">
          {CATEGORIES.map((cat) => {
            const list = catalogue.filter((x) => x.category === cat.id);
            if (!list.length) return null;
            return (
              <div key={cat.id} style={{ "--c": cat.color }}>
                <h3>
                  {cat.emoji} {hi ? cat.hi : cat.en}
                </h3>
                <p>{list.map((x) => (hi ? x.hi : x.en)).join(" · ")}</p>
              </div>
            );
          })}
        </div>
        <div className="d-flex gap-3 flex-wrap mt-2">
          <Link to={`/crops?state=${encodeURIComponent(name)}`}>
            {hi ? "फसल पुस्तकालय में देखें →" : "Open in crop library →"}
          </Link>
          <Link to="/weather">{hi ? "मौसम देखें →" : "Check weather →"}</Link>
          <Link to="/crop-recommendation">{hi ? "फसल सुझाव पाएँ →" : "Get a crop recommendation →"}</Link>
        </div>
      </section>
      <p className="disclaimer">
        {hi
          ? "ज़िला-स्तरीय जानकारी प्रतिनिधि उदाहरण है। स्थानीय सलाह के लिए किसान कॉल सेंटर 1800-180-1551 या अपने KVK से संपर्क करें।"
          : "District entries are representative examples, not a complete list of every block or village. For hyper-local advice contact Kisan Call Centre 1800-180-1551 or your district KVK."}
      </p>
    </>
  );
}
