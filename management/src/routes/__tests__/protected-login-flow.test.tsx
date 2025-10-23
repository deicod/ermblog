import { act, useEffect } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";

import { SessionProvider, useAuthActions } from "../../session/SessionProvider";
import { SessionRedirector } from "../../session/SessionRedirector";
import { dispatchSessionUnauthorized } from "../../session/sessionEvents";
import { ProtectedRoute } from "../ProtectedRoute";
import { LoginRoute } from "../login";

const mocks = vi.hoisted(() => {
  const initiateAuthorization = vi.fn();
  const exchangeCodeForToken = vi.fn();
  const clearPendingAuthorization = vi.fn();
  const getPendingAuthorization = vi.fn();
  const createOidcClient = vi.fn(() => ({
    initiateAuthorization,
    exchangeCodeForToken,
    clearPendingAuthorization,
    getPendingAuthorization,
  }));
  const resolveOidcConfig = vi.fn(() => ({
    clientId: "client",
    authorizationEndpoint: "https://auth.example/authorize",
    tokenEndpoint: "https://auth.example/token",
    redirectUri: "http://localhost/login",
    scope: "openid profile",
    issuer: "https://issuer.example/",
  }));

  return {
    initiateAuthorization,
    exchangeCodeForToken,
    clearPendingAuthorization,
    getPendingAuthorization,
    createOidcClient,
    resolveOidcConfig,
  };
});

vi.mock("../../session/oidcClient", () => ({
  createOidcClient: mocks.createOidcClient,
}));

vi.mock("../../config/oidcConfig", () => ({
  resolveOidcConfig: mocks.resolveOidcConfig,
}));

function createRouter(initialEntries: string[]) {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <>
            <SessionRedirector />
            <Outlet />
          </>
        ),
        children: [
          {
            path: "login",
            element: <LoginRoute />,
          },
          {
            path: "posts",
            element: (
              <ProtectedRoute>
                <div>Posts content</div>
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
    { initialEntries },
  );
}

describe("protected route login flow", () => {
  let originalLocationAssign: typeof window.location.assign;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    originalLocationAssign = window.location.assign.bind(window.location);
    Object.defineProperty(window.location, "assign", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window.location, "assign", {
      configurable: true,
      value: originalLocationAssign,
    });
  });

  it("redirects unauthenticated users to login and returns them to their destination after authentication", async () => {
    mocks.initiateAuthorization.mockResolvedValue({
      url: "https://auth.example/authorize?client_id=client",
      state: "generated-state",
    });

    const router = createRouter(["/posts"]);

    let persistSession: ReturnType<typeof useAuthActions>["persistSessionToken"] | null =
      null;

    function PersistSessionHandle() {
      const { persistSessionToken } = useAuthActions();

      useEffect(() => {
        persistSession = persistSessionToken;
        return () => {
          persistSession = null;
        };
      }, [persistSessionToken]);

      return null;
    }

    render(
      <SessionProvider>
        <PersistSessionHandle />
        <RouterProvider router={router} />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(router.state.location.state).toMatchObject({
      from: { pathname: "/posts" },
    });

    await waitFor(() => {
      expect(persistSession).toBeTypeOf("function");
    });

    act(() => {
      persistSession!({ accessToken: "access-token", tokenType: "Bearer" });
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/posts");
    });

    expect(router.state.location.state).toBeNull();
  });

  it("redirects to login with the current location when a session unauthorized event is dispatched", async () => {
    const router = createRouter(["/posts"]);

    let persistSession: ReturnType<typeof useAuthActions>["persistSessionToken"] | null =
      null;

    function PersistSessionHandle() {
      const { persistSessionToken } = useAuthActions();

      useEffect(() => {
        persistSession = persistSessionToken;
        return () => {
          persistSession = null;
        };
      }, [persistSessionToken]);

      return null;
    }

    render(
      <SessionProvider>
        <PersistSessionHandle />
        <RouterProvider router={router} />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(persistSession).toBeTypeOf("function");
    });

    act(() => {
      persistSession!({ accessToken: "access-token", tokenType: "Bearer" });
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/posts");
    });

    act(() => {
      dispatchSessionUnauthorized({ status: 401 });
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });

    expect(router.state.location.state).toMatchObject({
      from: { pathname: "/posts", search: "", hash: "" },
    });
  });
});
