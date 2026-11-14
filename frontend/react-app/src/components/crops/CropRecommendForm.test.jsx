import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { recommendCrop } from "@/services/cropService";
import { useHistoryStore } from "@/store/historyStore";
import { renderWithProviders } from "@/test/renderWithProviders";

import { CropRecommendForm } from "./CropRecommendForm";

vi.mock("@/services/cropService", () => ({ recommendCrop: vi.fn() }));

describe("<CropRecommendForm />", () => {
  beforeEach(() => {
    vi.mocked(recommendCrop).mockReset();
    useHistoryStore.setState({ entries: [] });
  });

  it("shows Zod errors and doesn't call the API for an empty form", async () => {
    renderWithProviders(<CropRecommendForm />);
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));
    expect(await screen.findByText("Nitrogen is required")).toBeInTheDocument();
    expect(recommendCrop).not.toHaveBeenCalled();
  });

  it("submits a sample and shows the ranked crops from the ML model", async () => {
    vi.mocked(recommendCrop).mockResolvedValue({
      method: "ml-model",
      top: [
        { crop: "rice", confidence: 0.95, season: "kharif", category: "cereal" },
        { crop: "jute", confidence: 0.04, season: "kharif", category: "fibre" },
      ],
    });
    renderWithProviders(<CropRecommendForm />);
    await userEvent.click(screen.getByRole("button", { name: "Wet paddy field" }));
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));

    expect(await screen.findByRole("link", { name: /rice/i })).toHaveAttribute("href", "/crops/rice");
    expect(screen.getByText("ML model")).toBeInTheDocument();
    expect(vi.mocked(recommendCrop).mock.calls[0][0]).toEqual({
      N: 85,
      P: 45,
      K: 40,
      temperature: 23.5,
      humidity: 82,
      ph: 6.5,
      rainfall: 230,
    });
    expect(useHistoryStore.getState().entries).toHaveLength(1);
  });

  it("shows a readable error when the API is unreachable", async () => {
    vi.mocked(recommendCrop).mockRejectedValue(new Error("Network down"));
    renderWithProviders(<CropRecommendForm />);
    await userEvent.click(screen.getByRole("button", { name: "Dry rabi plot" }));
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
  });
});
