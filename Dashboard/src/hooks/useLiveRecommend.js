import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api.js";

/**
 * Live crop recommendations over the FastAPI WebSocket (/api/ws/recommend).
 * Sends the latest soil reading whenever it changes; reconnects with backoff;
 * falls back to the REST endpoint if WebSockets are unavailable, so the page
 * keeps working behind proxies that block upgrades.
 */
export function useLiveRecommend(soil) {
  const [state, setState] = useState({ result: null, error: null, transport: "connecting" });
  const wsRef = useRef(null);
  const latest = useRef(soil);
  const failures = useRef(0);
  const sentAt = useRef(0);

  useEffect(() => {
    latest.current = soil; // read by onopen to send the newest reading after a reconnect
  }, [soil]);

  useEffect(() => {
    let closed = false;
    let retryTimer;

    const connect = () => {
      if (closed) return;
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      let ws;
      try {
        ws = new WebSocket(`${proto}://${window.location.host}/api/ws/recommend`);
      } catch {
        failures.current = 99;
        setState((s) => ({ ...s, transport: "rest" }));
        return;
      }
      wsRef.current = ws;
      ws.onopen = () => {
        failures.current = 0;
        setState((s) => ({ ...s, transport: "websocket", error: null }));
        sentAt.current = performance.now();
        ws.send(JSON.stringify(latest.current));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const ms = performance.now() - sentAt.current;
        if (msg.type === "error") setState((s) => ({ ...s, error: msg.message }));
        else setState((s) => ({ ...s, result: { ...msg, ms }, error: null }));
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (closed) return;
        failures.current += 1;
        if (failures.current >= 3) {
          setState((s) => ({ ...s, transport: "rest" }));
          return; // give up on WebSockets; REST takes over
        }
        setState((s) => ({ ...s, transport: "connecting" }));
        retryTimer = setTimeout(connect, 500 * 2 ** failures.current);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, []);

  // Push every new reading over the socket, or POST it when on the REST fallback.
  const key = JSON.stringify(soil);
  const transport = state.transport;
  useEffect(() => {
    const ws = wsRef.current;
    if (transport === "websocket" && ws?.readyState === WebSocket.OPEN) {
      sentAt.current = performance.now();
      ws.send(key);
      return undefined;
    }
    if (transport !== "rest") return undefined;
    const controller = new AbortController();
    const started = performance.now();
    api
      .post("/api/recommend/crop?top=3", JSON.parse(key), { signal: controller.signal })
      .then((res) => setState((s) => ({ ...s, result: { ...res, ms: performance.now() - started }, error: null })))
      .catch((error) => !controller.signal.aborted && setState((s) => ({ ...s, error: error.message })));
    return () => controller.abort();
  }, [key, transport]);

  return state;
}
