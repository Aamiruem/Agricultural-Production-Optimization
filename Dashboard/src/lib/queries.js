// Server state (TanStack Query). Each hook owns its key, endpoint and refresh policy.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, farmApi, mcpRpc, request } from "./api.js";

export const keys = {
  status: ["system", "status"],
  metrics: ["system", "metrics"],
  model: ["ml", "model"],
  yieldModel: ["ml", "yield-model"],
  coverage: ["yield", "coverage"],
  trend: (state, crop, season) => ["yield", "trend", state, crop, season],
  assistant: ["assistant", "status"],
  crops: ["crops"],
  me: ["auth", "me"],
  farms: ["farms"],
  farmSummary: (id) => ["farms", id, "summary"],
  mcpTools: ["mcp", "tools"],
  mcpHealth: ["mcp", "health"],
};

export const useSystemStatus = (opts = {}) =>
  useQuery({
    queryKey: keys.status,
    queryFn: ({ signal }) => api.get("/api/system/status", { signal, retries: 0 }),
    refetchInterval: 5000,
    ...opts,
  });

export const useSystemMetrics = (opts = {}) =>
  useQuery({
    queryKey: keys.metrics,
    queryFn: ({ signal }) => api.get("/api/system/metrics", { signal, retries: 0 }),
    refetchInterval: 2000,
    ...opts,
  });

export const useModel = () =>
  useQuery({ queryKey: keys.model, queryFn: ({ signal }) => api.get("/api/ml/model", { signal }), staleTime: 60_000 });

export const useYieldModel = () =>
  useQuery({
    queryKey: keys.yieldModel,
    queryFn: ({ signal }) => api.get("/api/ml/yield-model", { signal }),
    staleTime: 300_000,
  });

export const useCoverage = () =>
  useQuery({
    queryKey: keys.coverage,
    queryFn: ({ signal }) => api.get("/api/yield/coverage", { signal }),
    staleTime: Infinity,
  });

export const useTrend = (state, crop, season = "All seasons") =>
  useQuery({
    queryKey: keys.trend(state, crop, season),
    queryFn: ({ signal }) => api.get(`/api/yield/trend?${new URLSearchParams({ state, crop, season })}`, { signal }),
    enabled: Boolean(state && crop),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });

export const useAssistantStatus = () =>
  useQuery({
    queryKey: keys.assistant,
    queryFn: ({ signal }) => api.get("/api/assistant/status", { signal }),
    staleTime: 60_000,
  });

export const useCrops = () =>
  useQuery({ queryKey: keys.crops, queryFn: ({ signal }) => api.get("/api/crops", { signal }), staleTime: Infinity });

export const useMcpTools = () =>
  useQuery({ queryKey: keys.mcpTools, queryFn: () => mcpRpc("tools/list"), staleTime: 60_000, retry: 1 });

export const useMcpHealth = () =>
  useQuery({
    queryKey: keys.mcpHealth,
    queryFn: ({ signal }) => request("/mcp/health", { signal, service: "mcp", auth: false, retries: 0 }),
    refetchInterval: 10_000,
  });

export const useRecommend = () =>
  useMutation({ mutationFn: ({ soil, top = 3 }) => api.post(`/api/recommend/crop?top=${top}`, soil) });

export const useExplain = () =>
  useMutation({ mutationFn: ({ soil, top = 3 }) => api.post(`/api/ml/explain?top=${top}`, soil) });

export const useFertilizer = () => useMutation({ mutationFn: (body) => api.post("/api/recommend/fertilizer", body) });

export const useYieldPredict = () => useMutation({ mutationFn: (body) => api.post("/api/yield/predict", body) });

export const useReloadModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/ml/reload"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ml"] }),
  });
};

// Farms (Express farm-service; requires sign-in)
export const useFarms = (enabled) =>
  useQuery({ queryKey: keys.farms, queryFn: ({ signal }) => farmApi.get("/farms", { signal }), enabled });

export const useFarmSummary = (id) =>
  useQuery({
    queryKey: keys.farmSummary(id),
    queryFn: ({ signal }) => farmApi.get(`/farms/${id}/summary`, { signal }),
    enabled: Boolean(id),
  });

export const useCreateFarm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => farmApi.post("/farms", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.farms }),
  });
};

export const useDeleteFarm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => farmApi.del(`/farms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.farms }),
  });
};
