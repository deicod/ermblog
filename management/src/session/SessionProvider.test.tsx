import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  SessionProvider,
  useAuthActions,
  useSession,
} from "./SessionProvider";
import { SESSION_STORAGE_KEY } from "./tokenStorage";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.sessionStorage.clear();
});

function TestComponent() {
  const { sessionToken } = useSession();
  const { persistSessionToken, clearSessionToken } = useAuthActions();

  return (
    <div>
      <span data-testid="token">
        {sessionToken ? sessionToken.accessToken : "none"}
      </span>
      <button
        type="button"
        data-testid="persist"
        onClick={() =>
          persistSessionToken({ accessToken: "persisted", tokenType: "Bearer" })
        }
      >
        persist
      </button>
      <button
        type="button"
        data-testid="clear"
        onClick={() => clearSessionToken()}
      >
        clear
      </button>
    </div>
  );
}

describe("SessionProvider", () => {
  it("initializes state from storage", () => {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "stored-token" }),
    );

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    expect(screen.getByTestId("token").textContent).toBe("stored-token");
  });

  it("persists tokens and updates context", () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByTestId("persist"));

    expect(screen.getByTestId("token").textContent).toBe("persisted");
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(
      JSON.stringify({ accessToken: "persisted", tokenType: "Bearer" }),
    );
  });

  it("clears tokens and updates context", () => {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: "existing" }),
    );

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    fireEvent.click(screen.getByTestId("clear"));

    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("responds to storage events from other tabs", () => {
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    const serialized = JSON.stringify({ accessToken: "from-other-tab" });
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SESSION_STORAGE_KEY,
        newValue: serialized,
        storageArea: window.sessionStorage,
      }),
    );

    expect(screen.getByTestId("token").textContent).toBe("from-other-tab");
  });
});
