import { Suspense } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";

import { SessionProvider } from "../../session/SessionProvider";
import { SESSION_STORAGE_KEY } from "../../session/tokenStorage";
import { buildChildRoutes } from "../config";

vi.mock("../dashboard", () => ({
  DashboardRoute: () => <div>Dashboard content</div>,
}));

vi.mock("../posts", () => ({
  PostsRoute: () => <div>Posts content</div>,
}));

vi.mock("../login", () => ({
  LoginRoute: () => <div>Login screen</div>,
}));

function renderWithSession(initialEntries: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <div data-testid="shell">
            <Outlet />
          </div>
        ),
        children: buildChildRoutes(),
      },
    ],
    { initialEntries },
  );

  const renderResult = render(
    <SessionProvider>
      <Suspense fallback={<div>Loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </SessionProvider>,
  );

  return { router, ...renderResult };
}

describe("application routing", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
  });

  it("redirects unauthenticated users attempting to access protected routes", async () => {
    const { router } = renderWithSession(["/"]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("allows authenticated users to access protected routes", async () => {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "token", tokenType: "Bearer" }),
    );

    const { router } = renderWithSession(["/"]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
