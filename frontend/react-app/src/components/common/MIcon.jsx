import { ICON_NAMES } from "@/lib/icons";

const KNOWN = new Set(ICON_NAMES);

/** Google Material Symbols (Rounded) icon. `fill` uses the filled variant. */
export function MIcon({ name, size = 24, fill = false, className = "", style, label }) {
  if (import.meta.env.DEV && !KNOWN.has(name)) {
    console.warn(`MIcon: "${name}" is not in ICON_NAMES, so the font subset will not include it.`);
  }
  return (
    <span
      className={`msi${fill ? " fill" : ""} ${className}`}
      style={{ fontSize: size, ...style }}
      aria-hidden={label ? undefined : "true"}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {name}
    </span>
  );
}
