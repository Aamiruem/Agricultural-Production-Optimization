import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Default: same origin (Vite proxy / Nginx forward /socket.io to the farm-service).
const SOCKET_URL = import.meta.env.VITE_FARM_SOCKET_URL || undefined;

/**
 * Socket.IO connection to the farm-service. Server events refresh the
 * matching TanStack Query caches so every open tab stays in sync.
 */
export function useFarmSocket(token) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState([]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    const refresh = (farmId) => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      if (farmId) queryClient.invalidateQueries({ queryKey: ["farm", String(farmId)] });
    };

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("farm:created", () => refresh());
    socket.on("farm:deleted", () => refresh());
    ["field:created", "field:updated", "field:deleted"].forEach((event) =>
      socket.on(event, (field) => refresh(field.farmId)),
    );
    socket.on("activity:created", (activity) => {
      setLive((prev) => [activity, ...prev].slice(0, 10));
      refresh(activity.farmId);
    });

    return () => {
      socket.close();
      setConnected(false);
    };
  }, [token, queryClient]);

  return { connected, live };
}
