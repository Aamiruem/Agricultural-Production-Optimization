"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  display: string; // formatted value shown as text (identity is never color-only)
}

/**
 * Single-series horizontal bar chart (magnitude): one hue, sorted, value
 * labels in text ink, 4px rounded data-ends anchored at the baseline,
 * hover highlight + tooltip. Doubles as its own table view.
 */
export function HBarChart({ data, caption }: { data: BarDatum[]; caption: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...data.map((d) => d.value), Number.EPSILON);

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{caption}</figcaption>
      <ul className="space-y-1.5" aria-label={caption}>
        {data.map((d) => (
          <li
            key={d.label}
            className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm"
            onMouseEnter={() => setHover(d.label)}
            onMouseLeave={() => setHover(null)}
            title={`${d.label}: ${d.display}`}
          >
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="relative h-3 rounded-r bg-muted/60" aria-hidden>
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-r-[4px] bg-primary transition-opacity",
                  hover && hover !== d.label && "opacity-40",
                )}
                style={{ width: `${Math.max((d.value / max) * 100, 1)}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{d.display}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
