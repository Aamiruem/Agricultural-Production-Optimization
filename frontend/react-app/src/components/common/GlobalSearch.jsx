import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { CATEGORY_BY_ID, CROPS, STATES } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";
import { ALL_LINKS } from "@/layouts/navigation";

import { MIcon } from "./MIcon";

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

export function GlobalSearch({ autoFocus = false, onDone }) {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const listId = useId();
  const index = useMemo(() => buildSearchIndex(t, lang), [t, lang]);
  const results = useMemo(() => searchIndex(index, query), [index, query]);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  // "/" focuses search, like Google apps.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (item) => {
    if (!item) return;
    navigate(item.to);
    setQuery(""); setOpen(false); onDone?.();
    inputRef.current?.blur();
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[active]); }
    else if (e.key === "Escape") { setOpen(false); onDone?.(); }
  };
  const placeholder = lang === "hi" ? "फसल, राज्य या टूल खोजें" : "Search crops, states and tools";
  const showList = open && query.trim().length > 0;

  return (
    <div className={`g-search${showList ? " is-open" : ""}`} role="search">
      <MIcon name="search" size={22} className="g-search-icon" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {query && <button type="button" className="g-search-clear" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(""); inputRef.current?.focus(); }}><MIcon name="close" size={20} /></button>}
      {!query && <kbd className="g-search-kbd" aria-hidden="true">/</kbd>}
      {showList && (
        <ul id={listId} role="listbox" className="g-search-list">
          {results.length === 0 && <li className="g-search-empty">{lang === "hi" ? "कोई परिणाम नहीं" : "No results"}</li>}
          {results.map((r, i) => (
            <li key={r.id} id={`${listId}-${r.id}`} role="option" aria-selected={i === active} className={i === active ? "on" : ""}
              onMouseDown={(e) => e.preventDefault()} onClick={() => go(r)} onMouseEnter={() => setActive(i)}>
              <span className="g-search-lead" style={{ "--c": r.color || "#188038" }}>{r.emoji ? <span className="emoji">{r.emoji}</span> : <MIcon name={r.icon} size={20} fill />}</span>
              <span className="g-search-text"><b>{r.label}</b><small>{r.sub}</small></span>
              <MIcon name="arrow_forward" size={18} className="g-search-go" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
