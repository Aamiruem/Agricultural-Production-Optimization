import { MIcon } from "./MIcon";

/**
 * Colourful tonal icon tile (Google style). `icon` is a Material Symbol name (string)
 * or a lucide component; `color` tints the icon and a soft container behind it.
 */
export function IconBadge({ icon, color = "#15803d", size = 22, className = "", box }) {
  const Icon = icon;
  return (
    <span
      className={`icon-badge ${className}`}
      style={{ "--c": color, ...(box ? { width: box, height: box } : null) }}
      aria-hidden="true"
    >
      {typeof icon === "string" ? <MIcon name={icon} size={size} fill /> : <Icon size={size - 2} strokeWidth={2.2} />}
    </span>
  );
}
