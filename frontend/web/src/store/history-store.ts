import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CropRecommendation, SoilConditions } from "@/lib/api/types";

// Zustand: lightweight client state for the recommendation history.
// Persisted to localStorage; `skipHydration` avoids SSR mismatches — the
// store is rehydrated once on the client in <Providers>.

export const HISTORY_LIMIT = 10;

export interface HistoryEntry {
  id: string;
  createdAt: string;
  soil: SoilConditions;
  result: CropRecommendation;
}

interface HistoryState {
  entries: HistoryEntry[];
  add: (soil: SoilConditions, result: CropRecommendation) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (soil, result) =>
        set((state) => ({
          entries: [
            { id: crypto.randomUUID(), createdAt: new Date().toISOString(), soil, result },
            ...state.entries,
          ].slice(0, HISTORY_LIMIT),
        })),
      remove: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "agri-recommendation-history",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
