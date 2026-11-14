import { MapPin } from "lucide-react";

import { STATES } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";

/** All 28 states and 8 union territories, grouped. */
export function StateSelect({ value, onChange, include, label, allOption, className = "" }) {
  const { t, lang } = useT();
  const list = include ? STATES.filter((s) => include.includes(s.name)) : STATES;
  const opt = (s) => (
    <option key={s.name} value={s.name}>
      {lang === "hi" ? `${s.hi} (${s.name})` : s.name}
    </option>
  );
  return (
    <label className={`field-label ${className}`}>
      <span>
        <MapPin size={15} /> {label ?? t("common.state")}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {allOption && <option value="">{allOption}</option>}
        <optgroup label={lang === "hi" ? "राज्य" : "States"}>{list.filter((s) => s.type === "state").map(opt)}</optgroup>
        {list.some((s) => s.type === "ut") && (
          <optgroup label={lang === "hi" ? "केंद्र शासित प्रदेश" : "Union territories"}>
            {list.filter((s) => s.type === "ut").map(opt)}
          </optgroup>
        )}
      </select>
    </label>
  );
}
