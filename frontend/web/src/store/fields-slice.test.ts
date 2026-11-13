import { describe, expect, it } from "vitest";

import reducer, {
  fieldAdded,
  fieldRemoved,
  fieldsHydrated,
  selectAreaBySeason,
  selectStatusCounts,
  selectTotalArea,
  statusAdvanced,
} from "./fields-slice";
import { FIELDS_STORAGE_KEY, makeStore, persistFields } from "./store";

const north = { name: "North plot", crop: "rice", areaHa: 2.5, season: "kharif" as const };
const south = { name: "South plot", crop: "chickpea", areaHa: 1.5, season: "rabi" as const };

describe("fields slice (Redux Toolkit)", () => {
  it("adds a field with a generated id and 'planned' status", () => {
    const state = reducer(undefined, fieldAdded(north));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ ...north, status: "planned" });
    expect(state.items[0].id).toEqual(expect.any(String));
  });

  it("cycles status planned → sown → harvested → planned", () => {
    let state = reducer(undefined, fieldAdded(north));
    const id = state.items[0].id;
    const seen = [];
    for (let i = 0; i < 3; i++) {
      state = reducer(state, statusAdvanced(id));
      seen.push(state.items[0].status);
    }
    expect(seen).toEqual(["sown", "harvested", "planned"]);
  });

  it("removes a field", () => {
    let state = reducer(undefined, fieldAdded(north));
    state = reducer(state, fieldRemoved(state.items[0].id));
    expect(state.items).toEqual([]);
  });

  it("computes totals with memoized selectors", () => {
    const store = makeStore();
    store.dispatch(fieldAdded(north));
    store.dispatch(fieldAdded(south));
    store.dispatch(fieldAdded({ ...north, name: "East", areaHa: 1 }));
    const state = store.getState();

    expect(selectTotalArea(state)).toBe(5);
    expect(selectAreaBySeason(state)).toEqual({ kharif: 3.5, rabi: 1.5 });
    expect(selectStatusCounts(state)).toEqual({ planned: 3, sown: 0, harvested: 0 });
    // memoized: same input state → same object
    expect(selectAreaBySeason(state)).toBe(selectAreaBySeason(state));
  });

  it("persists fields to localStorage and restores them", () => {
    const first = makeStore();
    const stop = persistFields(first);
    first.dispatch(fieldAdded(north));
    stop();
    expect(JSON.parse(localStorage.getItem(FIELDS_STORAGE_KEY)!)).toHaveLength(1);

    const second = makeStore();
    persistFields(second)();
    expect(second.getState().fields.items[0].name).toBe("North plot");
    expect(second.getState().fields.hydrated).toBe(true);
  });

  it("ignores corrupt saved data", () => {
    localStorage.setItem(FIELDS_STORAGE_KEY, "{not json");
    const store = makeStore();
    persistFields(store)();
    expect(store.getState().fields.items).toEqual([]);
    expect(reducer(undefined, fieldsHydrated([])).hydrated).toBe(true);
  });
});
