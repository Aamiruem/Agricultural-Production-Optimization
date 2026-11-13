import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { MIcon } from "@/components/common/MIcon";
import { districtsFor } from "@/data/districts";
import { STATES } from "@/data/indiaAgri";
import { useT } from "@/i18n/useT";
import { nearestState } from "@/lib/farmIntel";
import { createFarm } from "@/services/farmService";
import { farmSchema } from "@/utils/validation";

import { FarmInsights } from "./FarmInsights";

const DEFAULTS = { name: "", state: "", district: "", districtOther: "", village: "" };

export function NewFarmForm({ onCreated }) {
  const { lang } = useT();
  const hi = lang === "hi";
  const queryClient = useQueryClient();
  const [gps, setGps] = useState(null); // { lat, lng } | { error }
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(farmSchema), defaultValues: DEFAULTS,
  });
  const state = watch("state");
  const district = watch("district");
  const name = watch("name");
  const village = watch("village");
  const districts = districtsFor(state);
  const districtName = district === "__other" ? watch("districtOther") : district;
  const suggestion = [village, districtName].find((x) => x && x.length > 1);

  const mutation = useMutation({
    mutationFn: (v) => createFarm({
      name: v.name, state: v.state, village: v.village,
      district: v.district === "__other" ? v.districtOther : v.district,
      ...(gps?.lat ? { lat: gps.lat, lng: gps.lng } : {}),
    }),
    onSuccess: (farm) => {
      reset(DEFAULTS);
      setGps(null);
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      onCreated(farm._id);
    },
  });

  const locate = () => {
    if (!navigator.geolocation) { setGps({ error: "Location is not available in this browser." }); return; }
    setGps({ loading: true });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(5); const lng = +pos.coords.longitude.toFixed(5);
        setGps({ lat, lng });
        const guess = nearestState(lat, lng);
        if (guess && guess !== state) { setValue("state", guess); setValue("district", ""); }
      },
      () => setGps({ error: hi ? "स्थान की अनुमति नहीं मिली।" : "Location permission was denied." }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <section className="tool-card new-farm" aria-labelledby="new-farm-title">
      <h2 id="new-farm-title"><MIcon name="add" size={22} /> {hi ? "नया खेत जोड़ें" : "Add a farm"}</h2>
      <form noValidate aria-label="New farm" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <label className="field-label">
          <span>{hi ? "राज्य / केंद्र शासित प्रदेश" : "State / UT"}</span>
          <select {...register("state", { onChange: () => setValue("district", "") })}>
            <option value="">{hi ? "राज्य चुनें…" : "Select state…"}</option>
            <optgroup label={hi ? "राज्य" : "States"}>{STATES.filter((s) => s.type === "state").map((s) => <option key={s.name} value={s.name}>{hi ? `${s.hi} (${s.name})` : s.name}</option>)}</optgroup>
            <optgroup label={hi ? "केंद्र शासित प्रदेश" : "Union territories"}>{STATES.filter((s) => s.type === "ut").map((s) => <option key={s.name} value={s.name}>{hi ? `${s.hi} (${s.name})` : s.name}</option>)}</optgroup>
          </select>
        </label>

        <div className="two-col">
          <label className="field-label">
            <span>{hi ? "ज़िला" : "District"} {state && <em>({districts.length})</em>}</span>
            <select disabled={!state} {...register("district")}>
              <option value="">{state ? (hi ? "ज़िला चुनें…" : "Select district…") : (hi ? "पहले राज्य चुनें" : "Choose a state first")}</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              {state && <option value="__other">{hi ? "अन्य (टाइप करें)…" : "Other (type it)…"}</option>}
            </select>
          </label>
          <label className="field-label">
            <span>{hi ? "गाँव / ब्लॉक" : "Village / block"} <em>{hi ? "वैकल्पिक" : "optional"}</em></span>
            <input placeholder={hi ? "जैसे रामपुर" : "e.g. Rampur"} maxLength={80} {...register("village")} />
          </label>
        </div>
        {district === "__other" && (
          <label className="field-label">
            <span>{hi ? "ज़िले का नाम" : "District name"}</span>
            <input aria-invalid={Boolean(errors.districtOther)} maxLength={60} {...register("districtOther")} />
            {errors.districtOther && <small className="field-error" role="alert">{errors.districtOther.message}</small>}
          </label>
        )}

        <div className="gps-row">
          <button type="button" className="btn btn-outline btn-sm" onClick={locate} disabled={gps?.loading}>
            <MIcon name="my_location" size={18} /> {gps?.loading ? (hi ? "ढूँढ रहे हैं…" : "Locating…") : (hi ? "मेरा स्थान उपयोग करें" : "Use my location")}
          </button>
          {gps?.lat && <small className="gps-ok"><MIcon name="check_circle" size={16} fill /> GPS {gps.lat}, {gps.lng}</small>}
          {gps?.error && <small className="field-error">{gps.error}</small>}
        </div>

        <label className="field-label">
          <span>{hi ? "खेत का नाम" : "Farm name"}</span>
          <input placeholder={suggestion ? `${suggestion} ${hi ? "खेत" : "Farm"}` : (hi ? "जैसे हरा भरा खेत" : "e.g. Green Acres")} aria-invalid={Boolean(errors.name)} maxLength={80} {...register("name")} />
          {errors.name && <small className="field-error" role="alert">{errors.name.message}</small>}
        </label>
        {!name && suggestion && (
          <button type="button" className="chip suggest-chip" onClick={() => setValue("name", `${suggestion} ${hi ? "खेत" : "Farm"}`, { shouldValidate: true })}>
            <MIcon name="auto_awesome" size={16} fill /> {hi ? "सुझाव:" : "Use"} “{suggestion} {hi ? "खेत" : "Farm"}”
          </button>
        )}

        <ErrorAlert error={mutation.error} className="mt-2" />
        <button type="submit" className="btn btn-cta w-100 mt-3" disabled={mutation.isPending}>
          <MIcon name="add" size={20} /> {mutation.isPending ? (hi ? "सहेज रहे हैं…" : "Saving…") : (hi ? "खेत जोड़ें" : "Add farm")}
        </button>
      </form>
      {state && <div className="mt-3"><FarmInsights compact location={{ state, district: districtName, village, ...(gps?.lat ? { point: { coordinates: [gps.lng, gps.lat] } } : {}) }} /></div>}
    </section>
  );
}
