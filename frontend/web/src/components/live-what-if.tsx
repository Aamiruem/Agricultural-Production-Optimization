"use client";

import Slider from "@mui/material/Slider";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/lib/api/client";
import type { CropRecommendation, SoilConditions } from "@/lib/api/types";
import { formatCropName, formatPercent } from "@/lib/crops";

const WS_URL = API_URL.replace(/^http/, "ws") + "/ws/recommend";

const SLIDERS: { key: keyof SoilConditions; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "N", label: "Nitrogen", min: 0, max: 140, step: 1, unit: "" },
  { key: "P", label: "Phosphorus", min: 5, max: 145, step: 1, unit: "" },
  { key: "K", label: "Potassium", min: 5, max: 205, step: 1, unit: "" },
  { key: "ph", label: "pH", min: 3.5, max: 9.9, step: 0.1, unit: "" },
  { key: "temperature", label: "Temperature", min: 8, max: 44, step: 0.5, unit: "°C" },
  { key: "humidity", label: "Humidity", min: 14, max: 100, step: 1, unit: "%" },
  { key: "rainfall", label: "Rainfall", min: 20, max: 300, step: 5, unit: "mm" },
];

type Status = "connecting" | "open" | "closed";

/** WebSocket: re-ranks crops instantly as sliders move. */
export function LiveWhatIf() {
  const [soil, setSoil] = useState<SoilConditions>({ N: 80, P: 45, K: 40, temperature: 24, humidity: 80, ph: 6.5, rainfall: 200 });
  const [result, setResult] = useState<CropRecommendation | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const soilRef = useRef(soil);

  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closedByUs = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        setStatus("open");
        ws.send(JSON.stringify(soilRef.current));
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "recommendation") setResult(msg);
      };
      ws.onclose = () => {
        setStatus("closed");
        if (!closedByUs) retry = setTimeout(connect, 3000); // reconnect after a backend restart
      };
    }
    connect();
    return () => {
      closedByUs = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  function update(key: keyof SoilConditions, value: number) {
    const next = { ...soilRef.current, [key]: value };
    soilRef.current = next;
    setSoil(next);
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(next));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Live what-if
          <Badge variant={status === "open" ? "secondary" : "outline"}>{status === "open" ? "Live" : status}</Badge>
        </CardTitle>
        <CardDescription>Move a slider and the ranking updates instantly over a WebSocket.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <p id={`wi-${s.key}`} className="flex justify-between text-sm">
                <span>{s.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {soil[s.key]}
                  {s.unit}
                </span>
              </p>
              <Slider
                size="small"
                value={soil[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(_, v) => update(s.key, v as number)}
                slotProps={{ input: { "aria-labelledby": `wi-${s.key}` } }}
              />
            </div>
          ))}
        </div>
        <ol className="space-y-2 self-start" aria-label="Live ranking" aria-live="polite">
          {result?.top.map((t, i) => (
            <li key={t.crop} className="flex items-baseline justify-between rounded-lg border px-3 py-2 text-sm">
              <span>
                <span className="text-muted-foreground">#{i + 1} </span>
                {formatCropName(t.crop)}
              </span>
              <span className="tabular-nums">{formatPercent(t.confidence)}</span>
            </li>
          ))}
          {!result && <li className="text-sm text-muted-foreground">Waiting for the API…</li>}
        </ol>
      </CardContent>
    </Card>
  );
}
