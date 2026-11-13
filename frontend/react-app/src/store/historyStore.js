import { create } from "zustand";
import { persist } from "zustand/middleware";

// Zustand: recent crop recommendations kept in this browser (works signed out).
export const HISTORY_LIMIT = 10;

export const useHistoryStore = create()(
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
    { name: "agri-recommendation-history" },
  ),
);
