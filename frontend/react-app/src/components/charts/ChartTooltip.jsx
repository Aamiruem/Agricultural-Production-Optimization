/** Shared Recharts tooltip: values in text ink, series identity via a colour key. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = "",
  format = (v) => v?.toLocaleString("en-IN"),
  labelPrefix = "",
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined && (
        <div className="chart-tooltip-label">
          {labelPrefix}
          {label}
        </div>
      )}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="chart-tooltip-row">
          <i style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}</span>
          <b>
            {format(p.value)}
            {unit}
          </b>
        </div>
      ))}
    </div>
  );
}
