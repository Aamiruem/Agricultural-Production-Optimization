"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { FARM_API_URL } from "@/lib/api/client";
import type { Activity } from "@/lib/api/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_FARM_SOCKET_URL ?? new URL(FARM_API_URL).origin;

/**
 * Socket.IO connection to the farm service. Server events invalidate the
 * matching TanStack Query caches, so every open tab stays in sync.
 */
export function useFarmSocket(token: string | null) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState<Activity[]>([]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    const refresh = (farmId?: string) => {
      void queryClient.invalidateQueries({ queryKey: ["farms"] });
      if (farmId) void queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
    };

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("farm:created", () => refresh());
    socket.on("farm:deleted", () => refresh());
    for (const event of ["field:created", "field:updated", "field:deleted"]) {
      socket.on(event, (field: { farmId: string }) => refresh(field.farmId));
    }
    socket.on("activity:created", (activity: Activity & { farmId: string }) => {
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
