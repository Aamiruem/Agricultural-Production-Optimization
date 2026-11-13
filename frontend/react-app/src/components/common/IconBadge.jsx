/** Colourful rounded icon tile. `color` tints the icon and a soft background. */
export function IconBadge({ icon: Icon, color = "#16a34a", size = 20, className = "", box }) {
  return (
    <span className={`icon-badge ${className}`} style={{ "--c": color, ...(box ? { width: box, height: box } : null) }} aria-hidden="true">
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}
