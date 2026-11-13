import { beforeEach, describe, expect, it } from "vitest";

import type { CropRecommendation } from "@/lib/api/types";

import { HISTORY_LIMIT, useHistoryStore } from "./history-store";

const soil = { N: 80, P: 45, K: 40, temperature: 24, humidity: 80, ph: 6.5, rainfall: 220 };
const result: CropRecommendation = {
  method: "profile-similarity",
  top: [{ crop: "rice", confidence: 0.6, season: "kharif", category: "cereal" }],
};

describe("history store (Zustand)", () => {
  beforeEach(() => useHistoryStore.setState({ entries: [] }));

  it("adds newest entries first", () => {
    useHistoryStore.getState().add(soil, result);
    useHistoryStore.getState().add({ ...soil, N: 10 }, result);
    const { entries } = useHistoryStore.getState();
    expect(entries.map((e) => e.soil.N)).toEqual([10, 80]);
  });

  it(`keeps at most ${HISTORY_LIMIT} entries`, () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) useHistoryStore.getState().add({ ...soil, N: i }, result);
    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(HISTORY_LIMIT);
    expect(entries[0].soil.N).toBe(HISTORY_LIMIT + 4);
  });

  it("removes one entry and clears all", () => {
    useHistoryStore.getState().add(soil, result);
    useHistoryStore.getState().add(soil, result);
    const [first] = useHistoryStore.getState().entries;
    useHistoryStore.getState().remove(first.id);
    expect(useHistoryStore.getState().entries).toHaveLength(1);
    useHistoryStore.getState().clear();
    expect(useHistoryStore.getState().entries).toEqual([]);
  });
});
