import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { MIcon } from "@/components/common/MIcon";
import { STATE_BY_NAME } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";
import { deleteFarm } from "@/services/farmService";

export function FarmList({ farms, selectedId, onSelect }) {
  const { lang } = useT();
  const hi = lang === "hi";
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(null);
  const remove = useMutation({
    mutationFn: deleteFarm,
    onSuccess: () => { setConfirm(null); queryClient.invalidateQueries({ queryKey: ["farms"] }); },
  });

  if (farms.length === 0) return <p className="muted small">{hi ? "अभी कोई खेत नहीं — नीचे पहला खेत जोड़ें।" : "No farms yet — add your first one below."}</p>;

  return (
    <>
      <ul className="farm-list" aria-label="Your farms">
        {farms.map((farm) => {
          const st = STATE_BY_NAME[farm.location?.state];
          const place = [farm.location?.village, farm.location?.district, hi ? st?.hi : farm.location?.state].filter(Boolean).join(", ");
          const active = farm._id === selectedId;
          return (
            <li key={farm._id} className={active ? "active" : ""}>
              <button type="button" className="farm-item" onClick={() => onSelect(farm._id)} aria-current={active}>
                <span className="farm-avatar" aria-hidden="true">{farm.name.slice(0, 1).toUpperCase()}</span>
                <span className="farm-text">
                  <b>{farm.name}</b>
                  <small><MIcon name="location_on" size={14} /> {place || (hi ? "स्थान नहीं" : "No location")}</small>
                  <small>{farm.fields ?? 0} {hi ? "फ़ील्ड" : farm.fields === 1 ? "field" : "fields"} · {(farm.areaHa ?? 0).toFixed(1)} ha</small>
                </span>
              </button>
              {confirm === farm._id ? (
                <span className="confirm-delete">
                  <button type="button" className="g-text-btn danger" disabled={remove.isPending} onClick={() => remove.mutate(farm._id)}>{hi ? "हटाएँ" : "Delete"}</button>
                  <button type="button" className="g-text-btn" onClick={() => setConfirm(null)}>{hi ? "रद्द" : "Cancel"}</button>
                </span>
              ) : (
                <button type="button" className="icon-btn" aria-label={`Delete ${farm.name}`} onClick={() => setConfirm(farm._id)}><MIcon name="delete" size={20} /></button>
              )}
            </li>
          );
        })}
      </ul>
      <ErrorAlert error={remove.error} className="mt-2" />
    </>
  );
}
