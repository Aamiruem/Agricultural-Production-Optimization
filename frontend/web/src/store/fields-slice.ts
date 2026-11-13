import { createSelector, createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import type { Season } from "@/lib/api/types";

// Redux Toolkit: the farm planner (a list of fields with crop, area, season
// and progress). Structured, multi-action state like this is where Redux's
// actions, reducers and memoized selectors pay off.

export type FieldStatus = "planned" | "sown" | "harvested";

export interface Field {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  season: Season;
  status: FieldStatus;
}

export interface FieldsState {
  items: Field[];
  hydrated: boolean;
}

const initialState: FieldsState = { items: [], hydrated: false };

const NEXT_STATUS: Record<FieldStatus, FieldStatus> = {
  planned: "sown",
  sown: "harvested",
  harvested: "planned",
};

const fieldsSlice = createSlice({
  name: "fields",
  initialState,
  reducers: {
    fieldAdded: {
      reducer(state, action: PayloadAction<Field>) {
        state.items.push(action.payload);
      },
      prepare(field: Omit<Field, "id" | "status">) {
        return { payload: { ...field, id: nanoid(), status: "planned" as const } };
      },
    },
    fieldRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((f) => f.id !== action.payload);
    },
    statusAdvanced(state, action: PayloadAction<string>) {
      const field = state.items.find((f) => f.id === action.payload);
      if (field) field.status = NEXT_STATUS[field.status];
    },
    fieldsHydrated(state, action: PayloadAction<Field[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
    fieldsCleared(state) {
      state.items = [];
    },
  },
});

export const { fieldAdded, fieldRemoved, statusAdvanced, fieldsHydrated, fieldsCleared } =
  fieldsSlice.actions;
export default fieldsSlice.reducer;

// Selectors
type WithFields = { fields: FieldsState };

export const selectFields = (state: WithFields) => state.fields.items;

export const selectTotalArea = createSelector([selectFields], (fields) =>
  fields.reduce((sum, f) => sum + f.areaHa, 0),
);

export const selectAreaBySeason = createSelector([selectFields], (fields) =>
  fields.reduce<Partial<Record<Season, number>>>((acc, f) => {
    acc[f.season] = (acc[f.season] ?? 0) + f.areaHa;
    return acc;
  }, {}),
);

export const selectStatusCounts = createSelector([selectFields], (fields) =>
  fields.reduce<Record<FieldStatus, number>>(
    (acc, f) => ({ ...acc, [f.status]: acc[f.status] + 1 }),
    { planned: 0, sown: 0, harvested: 0 },
  ),
);
