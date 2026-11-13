import { configureStore } from "@reduxjs/toolkit";

import fieldsReducer from "./fieldsSlice";

export const STORAGE_KEY = "agri-planner";

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return Array.isArray(saved) ? { fields: { items: saved } } : undefined;
  } catch {
    return undefined;
  }
}

export function makeStore() {
  const store = configureStore({ reducer: { fields: fieldsReducer }, preloadedState: loadState() });

  // Persist planner fields whenever they change.
  let previous = store.getState().fields.items;
  store.subscribe(() => {
    const items = store.getState().fields.items;
    if (items === previous) return;
    previous = items;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full / private mode: keep working in memory
    }
  });
  return store;
}
