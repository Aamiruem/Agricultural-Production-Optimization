import { configureStore, type UnknownAction } from "@reduxjs/toolkit";

import fieldsReducer, { fieldsHydrated, type Field, type FieldsState } from "./fields-slice";

export const FIELDS_STORAGE_KEY = "agri-fields";

// Hand-written root reducer instead of `reducer: { fields }`: combineReducers
// probes reducers with a Math.random() action type, which Next.js Cache
// Components rejects during prerendering. Add new slices here.
function rootReducer(state: { fields: FieldsState } | undefined, action: UnknownAction) {
  return { fields: fieldsReducer(state?.fields, action) };
}

// A new store per app instance (never a module-level singleton), as
// recommended for Next.js so server requests never share state.
export function makeStore() {
  return configureStore({ reducer: rootReducer });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

/** Load saved fields from localStorage, then keep them in sync. Client only. */
export function persistFields(store: AppStore): () => void {
  let saved: Field[] = [];
  try {
    saved = JSON.parse(localStorage.getItem(FIELDS_STORAGE_KEY) ?? "[]");
  } catch {
    saved = [];
  }
  store.dispatch(fieldsHydrated(Array.isArray(saved) ? saved : []));

  let previous = store.getState().fields.items;
  return store.subscribe(() => {
    const items = store.getState().fields.items;
    if (items === previous) return;
    previous = items;
    try {
      localStorage.setItem(FIELDS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / private-mode errors
    }
  });
}
