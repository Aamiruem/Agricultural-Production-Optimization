import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import analytics from "@/data/generated/analytics.json";
import { useT } from "@/i18n/useT";
import { useChartColors } from "@/lib/chartTheme";

// Home-page dashboard preview. Loaded lazily so recharts and the analytics data are
// not part of the home page's critical path (faster LCP and less main-thread work).
export default function HomePreviewCharts() {
  const { lang } = useT();
  const hi = lang === "hi";
  const c = useChartColors();
  const punjab = analytics.states.Punjab.years.map(([year, area, production]) => ({ year, production, area }));
  const pie = analytics.states.Punjab.top.slice(0, 4).map(([name, value]) => ({ name, value }));
  return (
    <div className="preview-frame">
      <div className="g-card span-8">
        <div className="card-head2">
          <div>
            <h3>Punjab · {hi ? "उत्पादन" : "production"} (t)</h3>
            <p>1997–2020</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={punjab} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.primary} stopOpacity={0.5} />
                <stop offset="100%" stopColor={c.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="production" stroke={c.primary} strokeWidth={2} fill="url(#pv)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="g-card span-4">
        <div className="card-head2">
          <div>
            <h3>{hi ? "फसल वितरण" : "Crop distribution"}</h3>
            <p>{hi ? "क्षेत्रफल" : "by area"}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={pie}
              dataKey="value"
              innerRadius={42}
              outerRadius={64}
              paddingAngle={1.5}
              stroke={c.surface}
              strokeWidth={2}
            >
              {pie.map((p, i) => (
                <Cell key={p.name} fill={c.series[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <ul className="legend-list compact">
          {pie.map((p, i) => (
            <li key={p.name}>
              <i style={{ background: c.series[i] }} />
              {p.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
