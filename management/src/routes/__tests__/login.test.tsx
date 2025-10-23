import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { SessionProvider, useSession } from "../../session/SessionProvider";
import { SESSION_STORAGE_KEY } from "../../session/tokenStorage";
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

function SessionStateViewer() {
  const { sessionToken } = useSession();
  return (
    <div data-testid="session-indicator">
      {sessionToken ? sessionToken.accessToken : "none"}
    </div>
  );
}

function renderLogin(initialEntries: string[]) {
  return render(
    <SessionProvider>
      <SessionStateViewer />
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<LoginRoute />} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

describe("LoginRoute", () => {
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
    mocks.clearPendingAuthorization.mockImplementation(() => {});
    mocks.getPendingAuthorization.mockReturnValue({
      codeVerifier: "verifier",
      state: "generated-state",
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window.location, "assign", {
      configurable: true,
      value: originalLocationAssign,
    });
  });

  it("exchanges the authorization code and stores the resulting session", async () => {
    mocks.exchangeCodeForToken.mockResolvedValue({
      accessToken: "access-token",
      tokenType: "Bearer",
    });

    renderLogin(["/login?code=abc&state=generated-state"]);

    await waitFor(() => {
      expect(mocks.exchangeCodeForToken).toHaveBeenCalled();
    });

    const exchangeArgs = mocks.exchangeCodeForToken.mock.calls[0][0];
    expect(exchangeArgs.code).toBe("abc");
    expect(exchangeArgs.state).toBe("generated-state");

    const storageValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    expect(storageValue).not.toBeNull();
    expect(JSON.parse(storageValue!)).toMatchObject({ accessToken: "access-token" });

    await waitFor(() => {
      expect(screen.getByTestId("session-indicator").textContent).toBe("access-token");
    });

    await screen.findByText("You are signed in.");
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("surfaces token exchange failures and allows retry", async () => {
    mocks.exchangeCodeForToken.mockImplementation(() =>
      Promise.reject(new Error("token failure")),
    );
    mocks.initiateAuthorization.mockResolvedValue({
      url: "https://auth.example/authorize?client_id=client",
      state: "generated-state",
    });

    renderLogin(["/login?code=abc"]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("token failure");
    });

    expect(mocks.initiateAuthorization).not.toHaveBeenCalled();

    const retryButton = screen.getByText("Try again");
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mocks.initiateAuthorization).toHaveBeenCalled();
    });

    expect(window.location.assign).toHaveBeenCalledWith(
      "https://auth.example/authorize?client_id=client",
    );
  });

  it("clears the active session and restarts the login flow on logout", async () => {
    mocks.initiateAuthorization.mockResolvedValue({
      url: "https://auth.example/authorize?client_id=client",
      state: "generated-state",
    });
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "existing-token", tokenType: "Bearer" }),
    );

    renderLogin(["/login"]);

    await waitFor(() => {
      expect(screen.getByText("You are signed in.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Log out"));

    await waitFor(() => {
      expect(mocks.initiateAuthorization).toHaveBeenCalled();
    });

    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(window.location.assign).toHaveBeenCalledWith(
      "https://auth.example/authorize?client_id=client",
    );
  });
});
