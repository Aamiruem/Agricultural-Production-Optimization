import { create } from "zustand";

/**
 * The uploaded dataset for the instant dashboard. Kept in memory only (never sent
 * anywhere, cleared on reload) so moving between pages doesn't lose it.
 */
export const useDataStore = create((set) => ({
  source: null, // { name, size, kind: "file" | "sample" }
  table: null, // { columns, rows, truncated, totalRows }
  roleOverrides: {}, // role → column name ("" to disable)
  setTable: (source, table) => set({ source, table, roleOverrides: {} }),
  setRole: (role, column) => set((s) => ({ roleOverrides: { ...s.roleOverrides, [role]: column } })),
  clear: () => set({ source: null, table: null, roleOverrides: {} }),
}));
