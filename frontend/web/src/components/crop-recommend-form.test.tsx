import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { recommendCrop } from "@/lib/api/endpoints";
import { useHistoryStore } from "@/store/history-store";

import { CropRecommendForm } from "./crop-recommend-form";

vi.mock("@/lib/api/endpoints", () => ({ recommendCrop: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CropRecommendForm />
    </QueryClientProvider>,
  );
}

describe("<CropRecommendForm />", () => {
  beforeEach(() => {
    vi.mocked(recommendCrop).mockReset();
    useHistoryStore.setState({ entries: [] });
  });

  it("shows Zod validation errors and does not call the API when empty", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));

    expect(await screen.findByText("Nitrogen is required")).toBeInTheDocument();
    expect(screen.getByLabelText(/nitrogen/i)).toHaveAttribute("aria-invalid", "true");
    expect(recommendCrop).not.toHaveBeenCalled();
  });

  it("rejects out-of-range pH", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Wet paddy field" }));
    const ph = screen.getByLabelText(/soil ph/i);
    await userEvent.clear(ph);
    await userEvent.type(ph, "20");
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));

    expect(await screen.findByText("pH must be at most 14")).toBeInTheDocument();
    expect(recommendCrop).not.toHaveBeenCalled();
  });

  it("submits a sample, renders ranked crops and records history", async () => {
    vi.mocked(recommendCrop).mockResolvedValue({
      method: "profile-similarity",
      top: [
        { crop: "rice", confidence: 0.72, season: "kharif", category: "cereal" },
        { crop: "jute", confidence: 0.2, season: "kharif", category: "fibre" },
      ],
    });
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Wet paddy field" }));
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));

    expect(await screen.findByRole("link", { name: /rice/i })).toHaveAttribute("href", "/crops/rice");
    expect(screen.getByText(/^72%/)).toHaveTextContent("72% match");
    expect(vi.mocked(recommendCrop).mock.calls[0][0]).toEqual({
      N: 85, P: 45, K: 40, temperature: 23.5, humidity: 82, ph: 6.5, rainfall: 230,
    });
    expect(useHistoryStore.getState().entries).toHaveLength(1);
  });

  it("shows a friendly error when the API fails", async () => {
    vi.mocked(recommendCrop).mockRejectedValue(new Error("Server exploded"));
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Dry rabi plot" }));
    await userEvent.click(screen.getByRole("button", { name: /recommend crops/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server exploded");
  });
});
