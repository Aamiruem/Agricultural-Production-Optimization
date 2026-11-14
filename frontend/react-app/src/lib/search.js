import { ALL_LINKS } from "@/layouts/navigation";

/**
 * Crop and state reference data (~40 KB). Loaded on demand — the first time the
 * search box is used — so it stays out of the bundle every page downloads.
 */
export const loadAgriData = () => import("@/data/indiaAgri");

/**
 * Search index over tools, crops and states (English + Hindi).
 * Tools are always present; crops and states are added once `agri` has loaded.
 */
export function buildSearchIndex(t, lang, agri = null) {
  const hi = lang === "hi";
  if (!agri) return ALL_LINKS.map((l) => toolEntry(l, t, hi));
  const { CATEGORY_BY_ID, CROPS, STATES } = agri;
  return [
    ...ALL_LINKS.map((l) => toolEntry(l, t, hi)),
    ...CROPS.map((c) => ({
      id: `c-${c.id}`,
      kind: "crop",
      label: hi ? c.hi : c.en,
      sub: hi ? CATEGORY_BY_ID[c.category].hi : CATEGORY_BY_ID[c.category].en,
      to: `/crops?query=${encodeURIComponent(c.en.split(" (")[0])}`,
      emoji: c.emoji,
      text: `${c.en} ${c.hi} ${c.id}`,
    })),
    ...STATES.map((s) => ({
      id: `s-${s.slug}`,
      kind: "state",
      label: hi ? s.hi : s.name,
      sub: s.type === "ut" ? (hi ? "केंद्र शासित प्रदेश" : "Union territory") : hi ? "राज्य" : "State",
      to: `/states?state=${encodeURIComponent(s.name)}`,
      icon: "location_on",
      color: "#129eaf",
      text: `${s.name} ${s.hi} ${s.capital}`,
    })),
  ];
}

function toolEntry(l, t, hi) {
  return {
    id: `p${l.to}`,
    kind: "tool",
    label: t(l.key),
    sub: hi ? "टूल" : "Tool",
    to: l.to,
    icon: l.icon,
    color: l.color,
    text: `${t(l.key)} ${l.to}`,
  };
}

export function searchIndex(index, query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .map((item) => {
      const text = item.text.toLowerCase();
      const label = item.label.toLowerCase();
      const score = label.startsWith(q)
        ? 3
        : text.split(/\s+/).some((w) => w.startsWith(q))
          ? 2
          : text.includes(q)
            ? 1
            : 0;
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((r) => r.item);
}
