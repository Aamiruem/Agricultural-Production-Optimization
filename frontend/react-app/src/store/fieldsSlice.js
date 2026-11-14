import { createSelector, createSlice, nanoid } from "@reduxjs/toolkit";

// Redux Toolkit: the offline farm planner (fields with crop, area, season, progress).

const NEXT_STATUS = { planned: "sown", sown: "harvested", harvested: "planned" };

const fieldsSlice = createSlice({
  name: "fields",
  initialState: { items: [] },
  reducers: {
    fieldAdded: {
      reducer(state, action) {
        state.items.push(action.payload);
      },
      prepare(field) {
        return { payload: { ...field, id: nanoid(), status: "planned" } };
      },
    },
    fieldRemoved(state, action) {
      state.items = state.items.filter((f) => f.id !== action.payload);
    },
    statusAdvanced(state, action) {
      const field = state.items.find((f) => f.id === action.payload);
      if (field) field.status = NEXT_STATUS[field.status];
    },
    fieldsCleared(state) {
      state.items = [];
    },
  },
});

export const { fieldAdded, fieldRemoved, statusAdvanced, fieldsCleared } = fieldsSlice.actions;
export default fieldsSlice.reducer;

// Memoized selectors
export const selectFields = (state) => state.fields.items;

export const selectTotalArea = createSelector([selectFields], (fields) => fields.reduce((sum, f) => sum + f.areaHa, 0));

export const selectAreaBySeason = createSelector([selectFields], (fields) =>
  fields.reduce((acc, f) => ({ ...acc, [f.season]: (acc[f.season] ?? 0) + f.areaHa }), {}),
);

export const selectStatusCounts = createSelector([selectFields], (fields) =>
  fields.reduce((acc, f) => ({ ...acc, [f.status]: acc[f.status] + 1 }), { planned: 0, sown: 0, harvested: 0 }),
);
