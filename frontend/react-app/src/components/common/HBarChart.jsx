import { useState } from "react";

/**
 * Single-series horizontal bar chart (magnitude): one hue, sorted by the
 * caller, value labels in text, hover highlight + tooltip. It doubles as a
 * table view, so the numbers never depend on colour alone.
 */
export function HBarChart({ caption, data }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), Number.EPSILON);

  return (
    <figure className="mb-0">
      <figcaption className="small fw-semibold mb-2">{caption}</figcaption>
      <ul className="list-unstyled mb-0 d-grid gap-2" aria-label={caption}>
        {data.map((d) => (
          <li
            key={d.label}
            className="d-grid align-items-center gap-3 small"
            style={{ gridTemplateColumns: "8rem minmax(0,1fr) 4rem" }}
            onMouseEnter={() => setHover(d.label)}
            onMouseLeave={() => setHover(null)}
            title={`${d.label}: ${d.display}`}
          >
            <span className="text-body-secondary text-truncate">{d.label}</span>
            <span className="hbar-track" aria-hidden>
              <span
                className="hbar-fill d-block"
                style={{
                  width: `${Math.max((d.value / max) * 100, 1)}%`,
                  opacity: hover && hover !== d.label ? 0.4 : 1,
                }}
              />
            </span>
            <span className="text-end tabular">{d.display}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
