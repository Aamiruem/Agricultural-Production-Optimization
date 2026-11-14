import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "@/store/authStore";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AdminRoute } from "./AdminRoute";
import { ProtectedRoute } from "./ProtectedRoute";

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/farms" element={<p>farms page</p>} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<p>admin page</p>} />
      </Route>
    </Routes>
  );
}

const signIn = (role) =>
  useAuthStore.setState({
    token: "t",
    expiresAt: Date.now() + 60_000,
    user: { id: 1, email: "a@example.com", full_name: "A", role },
  });

describe("route guards", () => {
  beforeEach(() => useAuthStore.getState().logout());

  it("sends signed-out users to /login", () => {
    renderWithProviders(routes(), { route: "/farms" });
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("lets signed-in users through", () => {
    signIn("farmer");
    renderWithProviders(routes(), { route: "/farms" });
    expect(screen.getByText("farms page")).toBeInTheDocument();
  });

  it("enforces the admin role (RBAC)", () => {
    signIn("farmer");
    const { unmount } = renderWithProviders(routes(), { route: "/admin" });
    expect(screen.getByText(/administrators only/)).toBeInTheDocument();
    unmount();

    signIn("admin");
    renderWithProviders(routes(), { route: "/admin" });
    expect(screen.getByText("admin page")).toBeInTheDocument();
  });
});
