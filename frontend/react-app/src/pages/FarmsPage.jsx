import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import { IconBadge } from "@/components/common/IconBadge";
import { Loader } from "@/components/common/Loader";
import { MIcon } from "@/components/common/MIcon";
import { PageHeader } from "@/components/common/PageHeader";
import { FarmDetail } from "@/components/farms/FarmDetail";
import { FarmList } from "@/components/farms/FarmList";
import { NewFarmForm } from "@/components/farms/NewFarmForm";
import { useFarmSocket } from "@/hooks/useFarmSocket";
import { useT } from "@/i18n/useT";
import { G } from "@/lib/icons";
import { fetchFarms, useFarmStorage } from "@/services/farmService";
import { useSession } from "@/store/authStore";

const REASONS = {
  "signed-out": [
    "Saved on this device",
    "इस डिवाइस पर सहेजा गया",
    "No account needed: your farms stay private in this browser.",
    "खाते की ज़रूरत नहीं: आपके खेत इसी ब्राउज़र में सुरक्षित रहते हैं।",
  ],
  "database-down": [
    "Database offline — saved on this device",
    "डेटाबेस बंद — इस डिवाइस पर सहेजा गया",
    "The farm service is running but MongoDB is not connected. Start MongoDB to sync.",
    "फ़ार्म सेवा चल रही है पर MongoDB जुड़ा नहीं है।",
  ],
  "service-down": [
    "Farm service offline — saved on this device",
    "फ़ार्म सेवा बंद — इस डिवाइस पर सहेजा गया",
    "Your changes stay in this browser until the service is reachable.",
    "सेवा उपलब्ध होने तक बदलाव इस ब्राउज़र में रहेंगे।",
  ],
};

export default function FarmsPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const { token, user } = useSession();
  const storage = useFarmStorage();
  const { connected, live } = useFarmSocket(storage.mode === "cloud" ? token : null);
  const farms = useQuery({ queryKey: ["farms", Boolean(token)], queryFn: fetchFarms, staleTime: 30_000 });
  const [selectedId, setSelectedId] = useState(null);
  const list = farms.data ?? [];
  const selected = list.find((f) => f._id === selectedId) ?? list[0];
  const totals = {
    fields: list.reduce((n, f) => n + (f.fields ?? 0), 0),
    area: list.reduce((n, f) => n + (f.areaHa ?? 0), 0),
    states: new Set(list.map((f) => f.location?.state).filter(Boolean)),
  };
  const reason = REASONS[storage.reason];

  return (
    <>
      <PageHeader
        title={hi ? "मेरे खेत" : "My farms"}
        description={
          hi
            ? "खेत, क्षेत्र और गतिविधियाँ एक जगह — स्थान के अनुसार मौसम, मिट्टी और फसल सुझाव सहित।"
            : "Farms, fields and activity in one place — with location-aware weather, soil and crop suggestions."
        }
        icon="agriculture"
        color={G.orange}
      />

      <div className={`storage-banner ${storage.mode}`} role="status">
        <MIcon name={storage.mode === "cloud" ? "cloud_done" : "cloud_off"} size={22} fill />
        {storage.mode === "cloud" ? (
          <span>
            <b>{hi ? "आपके खाते में सिंक" : "Synced to your account"}</b>
            {connected ? (hi ? " · लाइव अपडेट चालू" : " · live updates on") : ""}
            {user?.email ? ` · ${user.email}` : ""}
          </span>
        ) : (
          <span>
            <b>{hi ? reason[1] : reason[0]}</b> — {hi ? reason[3] : reason[2]}
          </span>
        )}
      </div>

      <div className="farm-stats">
        <Stat icon="agriculture" color={G.orange} value={list.length} label={hi ? "खेत" : "Farms"} />
        <Stat icon="grass" color={G.green} value={totals.fields} label={hi ? "क्षेत्र (फ़ील्ड)" : "Fields"} />
        <Stat
          icon="landscape"
          color={G.blue}
          value={`${totals.area.toFixed(1)} ha`}
          label={`${(totals.area / 0.404686).toFixed(1)} ${hi ? "एकड़" : "acres"}`}
        />
        <Stat icon="map" color={G.teal} value={totals.states.size} label={hi ? "राज्य" : "States"} />
      </div>

      <div className="farms-layout">
        <div className="farms-side">
          <div className="side-title">
            <h2>{hi ? "आपके खेत" : "Your farms"}</h2>
            {storage.mode === "cloud" && (
              <span className={`live-pill${connected ? "" : " off"}`}>{connected ? "● Live" : "Offline"}</span>
            )}
          </div>
          {farms.isLoading && <Loader label="Loading farms" />}
          <ErrorAlert error={farms.error} />
          {farms.data && <FarmList farms={list} selectedId={selected?._id} onSelect={setSelectedId} />}
          <NewFarmForm onCreated={setSelectedId} />
          {live.length > 0 && (
            <section aria-label="Live activity" className="tool-card">
              <h2>{hi ? "लाइव गतिविधि" : "Live activity"}</h2>
              <ul className="list-unstyled small mb-0 d-grid gap-1">
                {live.map((a) => (
                  <li key={a._id}>
                    <b className="text-capitalize">{a.type}</b> · {a.fieldName} ·{" "}
                    {new Date(a.date).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="farms-main">
          {selected ? (
            <FarmDetail key={selected._id} farmId={selected._id} />
          ) : (
            !farms.isLoading && (
              <div className="tool-card farms-empty">
                <IconBadge icon="agriculture" color={G.orange} box={72} size={38} />
                <h2>{hi ? "अपना पहला खेत जोड़ें" : "Add your first farm"}</h2>
                <p>
                  {hi
                    ? "राज्य और ज़िला चुनें — एग्रीस्मार्ट मौसम, मिट्टी, वर्तमान मौसम की फसलें और खाद योजना तुरंत दिखाएगा।"
                    : "Pick a state and district — AgriSmart instantly shows local weather, soils, the crops for this season and fertilizer plans for each field."}
                </p>
                <ol className="steps-mini">
                  <li>
                    <b>1</b>
                    {hi ? "खेत जोड़ें (राज्य, ज़िला, GPS)" : "Add a farm (state, district, GPS)"}
                  </li>
                  <li>
                    <b>2</b>
                    {hi ? "फ़ील्ड जोड़ें — फसल, क्षेत्र, मिट्टी N-P-K" : "Add fields — crop, area, soil N-P-K"}
                  </li>
                  <li>
                    <b>3</b>
                    {hi ? "बुवाई, सिंचाई, कटाई दर्ज करें" : "Log sowing, irrigation and harvest"}
                  </li>
                </ol>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon, color, value, label }) {
  return (
    <div className="farm-stat">
      <IconBadge icon={icon} color={color} />
      <div>
        <b>{value}</b>
        <small>{label}</small>
      </div>
    </div>
  );
}
