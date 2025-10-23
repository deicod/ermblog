import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  SessionProvider,
  useAuthActions,
  useSession,
} from "../SessionProvider";
import { SESSION_STORAGE_KEY } from "../tokenStorage";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { dispatchSessionUnauthorized } from "../sessionEvents";

type MockStorage = Storage & { __store: Map<string, string> };

function createStorageMock(): MockStorage {
  const store = new Map<string, string>();

  return {
    __store: store,
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } as MockStorage;
}

let sessionStorageMock: MockStorage;
let localStorageMock: MockStorage;

beforeEach(() => {
  sessionStorageMock = createStorageMock();
  localStorageMock = createStorageMock();

  vi.spyOn(window, "sessionStorage", "get").mockReturnValue(sessionStorageMock);
  vi.spyOn(window, "localStorage", "get").mockReturnValue(localStorageMock);

  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function SessionStateViewer() {
  const { sessionToken } = useSession();
  const { persistSessionToken, clearSessionToken } = useAuthActions();

  return (
    <div>
      <span data-testid="token-value">
        {sessionToken ? sessionToken.accessToken : "none"}
      </span>
      <button
        type="button"
        onClick={() =>
          persistSessionToken({ accessToken: "persisted", tokenType: "Bearer" })
        }
      >
        persist
      </button>
      <button type="button" onClick={() => clearSessionToken()}>
        clear
      </button>
    </div>
  );
}

describe("SessionProvider", () => {
  it("hydrates the session from stored tokens", () => {
    sessionStorageMock.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "stored-token", tokenType: "Bearer" }),
    );

    render(
      <SessionProvider>
        <SessionStateViewer />
      </SessionProvider>,
    );

    expect(screen.getByTestId("token-value").textContent).toBe("stored-token");
  });

  it("clears tokens via auth actions and removes them from storage", () => {
    sessionStorageMock.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "existing", tokenType: "Bearer" }),
    );

    render(
      <SessionProvider>
        <SessionStateViewer />
      </SessionProvider>,
    );

    expect(screen.getByTestId("token-value").textContent).toBe("existing");

    fireEvent.click(screen.getByText("clear"));

    expect(screen.getByTestId("token-value").textContent).toBe("none");
    expect(sessionStorageMock.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorageMock.__store.size).toBe(0);
  });

  it("renders protected routes only when a session exists", () => {
    const renderProtectedRoute = () =>
      render(
        <SessionProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Secret Content</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </SessionProvider>,
      );

    renderProtectedRoute();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();

    cleanup();

    sessionStorageMock.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "token", tokenType: "Bearer" }),
    );

    renderProtectedRoute();

    expect(screen.getByText("Secret Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("refreshes session state when storage events are received", () => {
    render(
      <SessionProvider>
        <SessionStateViewer />
      </SessionProvider>,
    );

    expect(screen.getByTestId("token-value").textContent).toBe("none");

    const serialized = JSON.stringify({ accessToken: "from-event", tokenType: "Bearer" });
    sessionStorageMock.setItem(SESSION_STORAGE_KEY, serialized);

    const syncPayload = JSON.stringify({ action: "persist", timestamp: Date.now() });

    act(() => {
      localStorageMock.setItem(`${SESSION_STORAGE_KEY}.sync`, syncPayload);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: `${SESSION_STORAGE_KEY}.sync`,
          newValue: syncPayload,
          storageArea: localStorageMock,
        }),
      );
    });

    expect(screen.getByTestId("token-value").textContent).toBe("from-event");
  });

  it("clears the session when an unauthorized event is dispatched", () => {
    sessionStorageMock.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "existing", tokenType: "Bearer" }),
    );

    window.history.replaceState(null, "", "/protected");

    render(
      <SessionProvider>
        <SessionStateViewer />
      </SessionProvider>,
    );

    expect(screen.getByTestId("token-value").textContent).toBe("existing");

    act(() => {
      dispatchSessionUnauthorized({ status: 401 });
    });

    expect(screen.getByTestId("token-value").textContent).toBe("none");
    expect(sessionStorageMock.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(window.location.pathname).toBe("/protected");
  });
});
