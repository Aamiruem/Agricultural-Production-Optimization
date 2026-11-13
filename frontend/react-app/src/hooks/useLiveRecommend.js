import { useCallback, useEffect, useRef, useState } from "react";

import { API_URL } from "@/services/apiClient";

function wsUrl() {
  const base = new URL(API_URL, window.location.origin); // works for "/api" and absolute URLs
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${base.href.replace(/\/$/, "")}/ws/recommend`;
}

/**
 * WebSocket to FastAPI: send soil readings, receive a fresh crop ranking.
 * Reconnects automatically (e.g. after a backend restart).
 */
export function useLiveRecommend(initialSoil) {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("connecting");
  const wsRef = useRef(null);
  const latest = useRef(initialSoil);

  useEffect(() => {
    let retry;
    let closedByUs = false;
    let failures = 0; // consecutive attempts that never opened

    function connect() {
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;
      let opened = false;
      ws.onopen = () => {
        opened = true;
        failures = 0;
        setStatus("open");
        ws.send(JSON.stringify(latest.current));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "recommendation") setResult(msg);
      };
      ws.onclose = () => {
        setStatus("closed");
        if (!opened) failures += 1;
        // No server socket (e.g. static hosting): stop after 3 tries; the UI uses the browser model.
        if (!closedByUs && failures < 3) retry = setTimeout(connect, 3000 * (failures + 1));
      };
    }
    connect();
    return () => {
      closedByUs = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((soil) => {
    latest.current = soil;
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(soil));
  }, []);

  return { result, status, send };
}
