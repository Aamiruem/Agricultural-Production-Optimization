import { beforeEach, describe, expect, it } from "vitest";

import reducer, {
  fieldAdded,
  fieldRemoved,
  selectAreaBySeason,
  selectStatusCounts,
  selectTotalArea,
  statusAdvanced,
} from "./fieldsSlice";
import { makeStore, STORAGE_KEY } from "./index";

const north = { name: "North plot", crop: "rice", areaHa: 2.5, season: "kharif" };
const south = { name: "South plot", crop: "chickpea", areaHa: 1.5, season: "rabi" };

describe("fields slice (Redux Toolkit)", () => {
  beforeEach(() => localStorage.clear());

  it("adds a field with an id and 'planned' status", () => {
    const state = reducer(undefined, fieldAdded(north));
    expect(state.items[0]).toMatchObject({ ...north, status: "planned" });
    expect(state.items[0].id).toEqual(expect.any(String));
  });

  it("cycles status planned → sown → harvested → planned and removes fields", () => {
    let state = reducer(undefined, fieldAdded(north));
    const id = state.items[0].id;
    const seen = [];
    for (let i = 0; i < 3; i++) {
      state = reducer(state, statusAdvanced(id));
      seen.push(state.items[0].status);
    }
    expect(seen).toEqual(["sown", "harvested", "planned"]);
    expect(reducer(state, fieldRemoved(id)).items).toEqual([]);
  });

  it("computes totals with memoized selectors", () => {
    const store = makeStore();
    store.dispatch(fieldAdded(north));
    store.dispatch(fieldAdded(south));
    const state = store.getState();
    expect(selectTotalArea(state)).toBe(4);
    expect(selectAreaBySeason(state)).toEqual({ kharif: 2.5, rabi: 1.5 });
    expect(selectStatusCounts(state)).toEqual({ planned: 2, sown: 0, harvested: 0 });
    expect(selectAreaBySeason(state)).toBe(selectAreaBySeason(state));
  });

  it("persists to localStorage and restores on the next load", () => {
    makeStore().dispatch(fieldAdded(north));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
    expect(makeStore().getState().fields.items[0].name).toBe("North plot");
  });

  it("ignores corrupt saved data", () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    expect(makeStore().getState().fields.items).toEqual([]);
  });
});
