import { CATEGORY_BY_ID, CROPS, STATES } from "@/data/indiaAgri";
import { ALL_LINKS } from "@/layouts/navigation";

/** Search index over tools, crops and states (English + Hindi). */
export function buildSearchIndex(t, lang) {
  const hi = lang === "hi";
  return [
    ...ALL_LINKS.map((l) => ({ id: `p${l.to}`, kind: "tool", label: t(l.key), sub: hi ? "टूल" : "Tool", to: l.to, icon: l.icon, color: l.color, text: `${t(l.key)} ${l.to}` })),
    ...CROPS.map((c) => ({ id: `c-${c.id}`, kind: "crop", label: hi ? c.hi : c.en, sub: hi ? CATEGORY_BY_ID[c.category].hi : CATEGORY_BY_ID[c.category].en, to: `/crops?query=${encodeURIComponent(c.en.split(" (")[0])}`, emoji: c.emoji, text: `${c.en} ${c.hi} ${c.id}` })),
    ...STATES.map((s) => ({ id: `s-${s.slug}`, kind: "state", label: hi ? s.hi : s.name, sub: s.type === "ut" ? (hi ? "केंद्र शासित प्रदेश" : "Union territory") : (hi ? "राज्य" : "State"), to: `/states?state=${encodeURIComponent(s.name)}`, icon: "location_on", color: "#129eaf", text: `${s.name} ${s.hi} ${s.capital}` })),
  ];
}

export function searchIndex(index, query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .map((item) => {
      const text = item.text.toLowerCase();
      const label = item.label.toLowerCase();
      const score = label.startsWith(q) ? 3 : text.split(/\s+/).some((w) => w.startsWith(q)) ? 2 : text.includes(q) ? 1 : 0;
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((r) => r.item);
}
