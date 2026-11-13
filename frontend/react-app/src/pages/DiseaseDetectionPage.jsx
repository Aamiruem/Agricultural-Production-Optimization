import { Camera, ScanLine, ShieldAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { PageHeader } from "@/components/common/PageHeader";
import { DISEASE_CROPS, SYMPTOMS, rankDiseases } from "@/data/diseases";
import { useT } from "@/i18n/useT";
import { analyzeLeafPixels } from "@/lib/agriModels";

// Fixed colours for the pixel classes (they describe what the pixels look like).
const CLASS = {
  healthy: { en: "Healthy green", color: "#16a34a" },
  yellow: { en: "Yellowing (chlorosis)", color: "#eab308" },
  brown: { en: "Brown / necrotic", color: "#92400e" },
  dark: { en: "Dark lesions", color: "#334155" },
  white: { en: "White / powdery", color: "#cbd5e1" },
};

export default function DiseaseDetectionPage() {
  const { lang } = useT();
  const hi = lang === "hi";
  const [crop, setCrop] = useState("Tomato");
  const [symptoms, setSymptoms] = useState([]);
  const [image, setImage] = useState(null);
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const onFile = (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG or PNG)."); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 320 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const result = analyzeLeafPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      if (result.plantPixels < 500) setError("Very little plant tissue detected. Photograph a single leaf filling most of the frame, in daylight.");
      setScan(result);
      setImage(url);
    };
    img.onerror = () => setError("Could not read that image.");
    img.src = url;
  };
  const toggle = (id) => setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const ranked = symptoms.length || scan ? rankDiseases({ crop, symptoms, pct: scan?.pct }) : [];
  const pie = scan ? Object.entries(scan.pct).filter(([, v]) => v > 0).map(([k, v]) => ({ name: CLASS[k].en, value: v, fill: CLASS[k].color })) : [];
  const maxScore = ranked[0]?.score || 1;

  return (
    <>
      <PageHeader page="disease" icon={ScanLine} color="#e11d48" />
      <div className="yield-layout">
        <section className="tool-card">
          <h2>{hi ? "1. फ़ोटो और फसल" : "1. Photo & crop"}</h2>
          <label className="field-label"><span>{hi ? "फसल" : "Crop"}</span><select value={crop} onChange={(e) => setCrop(e.target.value)}>{DISEASE_CROPS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <div
            className={`dropzone${image ? " has-image" : ""}`} role="button" tabIndex={0}
            onClick={() => inputRef.current?.click()} onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
          >
            {image ? <img src={image} alt="Uploaded leaf" /> : <><Upload size={30} /><b>{hi ? "पत्ती की फ़ोटो अपलोड करें" : "Upload or drop a leaf photo"}</b><small>JPG / PNG · processed only in your browser</small></>}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files[0])} />
          </div>
          <button className="btn btn-outline-success btn-sm mt-2" onClick={() => inputRef.current?.click()}><Camera size={16} /> {hi ? "कैमरा / गैलरी" : "Camera or gallery"}</button>
          {error && <p className="text-danger small mt-2" role="alert">{error}</p>}
          <h2 className="mt-4">{hi ? "2. आप क्या देख रहे हैं?" : "2. What do you see?"}</h2>
          <div className="chip-grid">{SYMPTOMS.map((s) => <button key={s.id} type="button" className={`chip${symptoms.includes(s.id) ? " on" : ""}`} aria-pressed={symptoms.includes(s.id)} onClick={() => toggle(s.id)}>{hi ? s.hi : s.en}</button>)}</div>
        </section>

        <section className="tool-card">
          <h2>{hi ? "3. जाँच परिणाम" : "3. Screening result"}</h2>
          {scan && <div className="scan-row">
            <div className="donut-wrap small">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={1.5} stroke="var(--bs-body-bg)" strokeWidth={2}>{pie.map((p) => <Cell key={p.name} fill={p.fill} />)}</Pie><Tooltip content={<ChartTooltip unit="%" />} /></PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><b>{scan.healthIndex}</b><small>leaf health</small></div>
            </div>
            <ul className="legend-list">{pie.map((p) => <li key={p.name}><i style={{ background: p.fill }} />{p.name}<b>{p.value}%</b></li>)}</ul>
          </div>}
          {!ranked.length ? (
            <div className="empty-panel"><ScanLine size={30} /><b>{hi ? "फ़ोटो अपलोड करें या लक्षण चुनें" : "Upload a photo or pick symptoms"}</b><span>{hi ? "संभावित समस्याएँ यहाँ दिखेंगी।" : "Likely problems and safe next steps will appear here."}</span></div>
          ) : (
            <ol className="disease-list">{ranked.map((d) => (
              <li key={d.id}>
                <div className="d-flex justify-content-between gap-2"><b>{hi ? d.hi : d.en}</b><span className="chip small">{d.type}</span></div>
                <div className="match-bar"><i style={{ width: `${Math.round((d.score / maxScore) * 100)}%` }} /></div>
                <ul>{d.care.map((c) => <li key={c}>{c}</li>)}</ul>
              </li>
            ))}</ol>
          )}
          <p className="disclaimer"><ShieldAlert size={15} /> This is colour-based screening plus a symptom matcher, not a laboratory diagnosis. Many diseases look alike. Confirm with your KVK / plant clinic before spraying any pesticide. <Link to="/assistant">Ask the AI assistant →</Link></p>
        </section>
      </div>
    </>
  );
}
