import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgotPassword, login, resetPassword } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AuthForm } from "./AuthForm";

vi.mock("@/services/authService", () => ({
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

const SESSION = {
  access_token: "jwt",
  token_type: "bearer",
  expires_in: 3600,
  user: { id: 1, email: "farmer@example.com", full_name: "Asha Devi", role: "user" },
};

function app(mode) {
  return (
    <Routes>
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/forgot-password" element={<AuthForm mode="forgot" />} />
      <Route path="/reset-password" element={<AuthForm mode={mode ?? "reset"} />} />
      <Route path="/dashboard" element={<p>dashboard page</p>} />
      <Route path="/weather" element={<p>weather page</p>} />
    </Routes>
  );
}

describe("auth forms", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.getState().logout();
  });

  it("validates before calling the API", async () => {
    renderWithProviders(app(), { route: "/login" });
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("signs in, stores the session and returns to the requested page", async () => {
    vi.mocked(login).mockResolvedValue(SESSION);
    renderWithProviders(app(), { route: "/login?next=%2Fweather" });
    await userEvent.type(screen.getByLabelText("Email"), "farmer@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("weather page")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("farmer@example.com", "secret123");
    expect(useAuthStore.getState().user.full_name).toBe("Asha Devi");
  });

  it("goes to the dashboard by default and shows API errors honestly", async () => {
    vi.mocked(login).mockRejectedValueOnce(
      new AxiosError("Unauthorized", "ERR_BAD_REQUEST", {}, null, {
        status: 401,
        data: { detail: "Incorrect email or password" },
      }),
    );
    renderWithProviders(app(), { route: "/login" });
    await userEvent.type(screen.getByLabelText("Email"), "farmer@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-pass1");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password");
    expect(useAuthStore.getState().token).toBeNull();

    vi.mocked(login).mockResolvedValueOnce(SESSION);
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
  });

  it("forgot password shows the server's message (and the dev link when no mail server)", async () => {
    vi.mocked(forgotPassword).mockResolvedValue({
      detail: "If an account exists for that email, a reset link has been sent.",
      dev_reset_url: "http://localhost:5173/reset-password?token=abc",
    });
    renderWithProviders(app(), { route: "/forgot-password" });
    await userEvent.type(screen.getByLabelText("Email"), "farmer@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText(/If an account exists/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reset-password\?token=abc/ })).toBeInTheDocument();
  });

  it("reset password needs a token and matching passwords", async () => {
    const { unmount } = renderWithProviders(app(), { route: "/reset-password" });
    expect(screen.getByText("Reset link missing")).toBeInTheDocument();
    unmount();

    vi.mocked(resetPassword).mockResolvedValue(undefined);
    renderWithProviders(app(), { route: "/reset-password?token=tok" });
    await userEvent.type(screen.getByLabelText("New password"), "newpass123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "different1");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText("Confirm new password"));
    await userEvent.type(screen.getByLabelText("Confirm new password"), "newpass123");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));
    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith("tok", "newpass123"));
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
  });
});
