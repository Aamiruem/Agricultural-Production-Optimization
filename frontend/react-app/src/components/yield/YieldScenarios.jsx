import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { predictYieldLocal } from "@/lib/agriModels";
import { useChartColors } from "@/lib/chartTheme";

/** What-if comparison: monsoon scenarios and the trend over coming years (browser model). */
export function YieldScenarios({ crop, state, season, year, areaHa }) {
  const c = useChartColors();
  let rows;
  try {
    const base = predictYieldLocal({ crop, state, season, year, area_ha: areaHa });
    const typical = base.typical_rain_mm;
    const run = (label, patch) => {
      const r = predictYieldLocal({ crop, state, season, year, area_ha: areaHa, ...patch });
      return { label, yield: r.yield_t_ha, production: r.production_t, change: Math.round(((r.yield_t_ha / base.yield_t_ha) - 1) * 1000) / 10 };
    };
    rows = [
      run("Severe drought (−40% rain)", { annual_rainfall: typical * 0.6 }),
      run("Weak monsoon (−20%)", { annual_rainfall: typical * 0.8 }),
      run("Normal rainfall", { annual_rainfall: typical }),
      run("Good monsoon (+20%)", { annual_rainfall: typical * 1.2 }),
      run(`${Number(year) + 3} at normal rain`, { year: Number(year) + 3, annual_rainfall: typical }),
    ];
  } catch {
    return null;
  }
  const base = rows[2];
  return (
    <section className="tool-card">
      <h2>What-if scenarios</h2>
      <p className="muted">How {crop} in {state} ({season}) responds to rainfall and the multi-year trend. Change vs normal rainfall.</p>
      <div className="two-col scenario-layout">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} margin={{ top: 16, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="label" stroke={c.axis} tickLine={false} axisLine={false} fontSize={10} interval={0} tickFormatter={(v) => v.split(" (")[0]} />
            <YAxis stroke={c.axis} tickLine={false} axisLine={false} fontSize={11} domain={[0, "auto"]} />
            <Tooltip cursor={{ fill: c.grid }} content={<ChartTooltip unit=" t/ha" />} />
            <Bar dataKey="yield" name="Yield" radius={[4, 4, 0, 0]} maxBarSize={44} label={{ position: "top", fill: c.text, fontSize: 11 }}>
              {rows.map((r) => <Cell key={r.label} fill={r === base ? c.primary : r.change < 0 ? c.series[1] : c.series[0]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="table-responsive">
          <table className="table table-sm data-table mb-0">
            <thead><tr><th>Scenario</th><th>t/ha</th><th>Field (t)</th><th>vs normal</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.label}><td>{r.label}</td><td>{r.yield}</td><td>{r.production}</td><td className={r.change < 0 ? "text-danger" : r.change > 0 ? "text-success" : ""}>{r.change > 0 ? "+" : ""}{r.change}%</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
