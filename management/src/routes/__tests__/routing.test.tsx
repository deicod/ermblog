import { Suspense } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { SessionProvider } from "../../session/SessionProvider";
import { SESSION_STORAGE_KEY } from "../../session/tokenStorage";
import { AppHeader } from "../../components/layout/AppHeader";
import { AppShell } from "../../components/layout/AppShell";
import {
  ROUTE_IDS,
  buildChildRoutes,
  createRouteObject,
  getRouteDefinition,
} from "../config";

vi.mock("../../components/layout/AppHeader", () => ({
  AppHeader: vi.fn(() => <div data-testid="app-header" />),
}));

vi.mock("../../components/layout/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock("../dashboard", () => ({
  DashboardRoute: () => <div>Dashboard content</div>,
}));

vi.mock("../posts", () => ({
  PostsRoute: () => <div>Posts content</div>,
}));

vi.mock("../comments", () => ({
  CommentsRoute: () => <div>Comments content</div>,
}));

vi.mock("../login", () => ({
  LoginRoute: () => <div>Login screen</div>,
}));

const mockedAppHeader = vi.mocked(AppHeader);

function renderWithSession(
  initialEntries: string[],
  options: { authenticated?: boolean } = {},
) {
  const { authenticated = false } = options;

  if (authenticated) {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "token", tokenType: "Bearer" }),
    );
  }

  const loginRoute = createRouteObject(getRouteDefinition(ROUTE_IDS.login), {
    useHref: true,
  });

  const router = createMemoryRouter(
    [
      loginRoute,
      {
        path: "/",
        element: <AppShell />,
        children: buildChildRoutes({ includePublic: false }),
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
    mockedAppHeader.mockClear();
  });

  it("redirects unauthenticated users attempting to access protected routes", async () => {
    const { router } = renderWithSession(["/"]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("redirects unauthenticated users attempting to access the comments route", async () => {
    const { router } = renderWithSession(["/comments"]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("renders the standalone login route without mounting the shell", async () => {
    const { router } = renderWithSession(["/login"]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(screen.getByText("Login screen")).toBeInTheDocument();
    expect(mockedAppHeader).not.toHaveBeenCalled();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  it("allows authenticated users to access protected routes", async () => {
    const { router } = renderWithSession(["/"], { authenticated: true });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(mockedAppHeader).toHaveBeenCalled();
  });
});
