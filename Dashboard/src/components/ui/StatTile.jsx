import { Sparkline } from "@/components/charts/Charts.jsx";

import { cx } from "@/lib/cx.js";
import { Icon, Skeleton } from "./primitives.jsx";

/**
 * Stat tile: label · value · optional delta (signed, vs a named period, coloured by
 * direction × whether up is good) · optional sparkline (de-emphasis hue, latest
 * point in the accent).
 */
export function StatTile({ label, value, unit, icon, hint, delta, upIsGood = true, trend, loading = false }) {
  const good = delta ? delta.value >= 0 === upIsGood : null;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-3xl border border-outline bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] font-medium text-ink-2">{label}</p>
        {icon && <Icon name={icon} size={20} className="text-ink-3" />}
      </div>
      {loading ? (
        <Skeleton className="h-9 w-28" />
      ) : (
        <p className="flex items-baseline gap-1 text-[30px] leading-none font-medium tracking-tight text-ink tabular-nums">
          {value}
          {unit && <span className="text-base font-normal text-ink-2">{unit}</span>}
        </p>
      )}
      <div className="flex min-h-5 items-center justify-between gap-3">
        {delta ? (
          <span className={cx("inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-good" : "text-bad")}>
            <Icon name={delta.value >= 0 ? "arrow_upward" : "arrow_downward"} size={14} />
            {delta.label}
          </span>
        ) : (
          <span className="truncate text-xs text-ink-3">{hint}</span>
        )}
      </div>
      {trend && <Sparkline values={trend} />}
    </div>
  );
}
