import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import { translations } from "@/i18n/translations";
import { buildSearchIndex, searchIndex } from "@/lib/search";
import { renderWithProviders } from "@/test/renderWithProviders";

import { GlobalSearch } from "./GlobalSearch";

const t = (key) => key.split(".").reduce((n, p) => n?.[p], translations.en) ?? key;

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}{loc.search}</p>;
}

describe("search index", () => {
  const index = buildSearchIndex(t, "en");
  it("finds crops, states and tools", () => {
    expect(searchIndex(index, "wheat")[0].label).toBe("Wheat");
    expect(searchIndex(index, "kerala").some((r) => r.kind === "state")).toBe(true);
    expect(searchIndex(index, "yield").some((r) => r.to === "/yield-prediction")).toBe(true);
    expect(searchIndex(index, "")).toEqual([]);
  });
  it("matches Hindi crop names", () => {
    expect(searchIndex(index, "गेहूँ")[0].label).toBe("Wheat");
  });
});

describe("GlobalSearch", () => {
  it("navigates to the highlighted result with the keyboard", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Routes><Route path="*" element={<><GlobalSearch /><Where /></>} /></Routes>, { route: "/" });
    const box = screen.getByRole("combobox");
    await user.type(box, "mango");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Mango");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("where")).toHaveTextContent("/crops?query=Mango");
    expect(box).toHaveValue("");
  });

  it("shows an empty state for no matches", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Routes><Route path="*" element={<GlobalSearch />} /></Routes>, { route: "/" });
    await user.type(screen.getByRole("combobox"), "zzzzqq");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});
