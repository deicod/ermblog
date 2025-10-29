import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import type { SessionToken } from "../session/tokenStorage";

const { fetchQueryMock, useSessionMock, relayEnvironment } = vi.hoisted(() => ({
  fetchQueryMock: vi.fn(),
  useSessionMock: vi.fn<{ sessionToken: SessionToken | null }, []>(),
  relayEnvironment: {},
}));

vi.mock("react-relay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-relay")>();
  return {
    __esModule: true,
    ...actual,
    useRelayEnvironment: vi.fn(() => relayEnvironment as any),
    fetchQuery: fetchQueryMock,
  };
});

vi.mock("../session/SessionProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../session/SessionProvider")>();
  return {
    __esModule: true,
    ...actual,
    useSession: () => useSessionMock(),
  };
});

import {
  NotificationPreferencesProvider,
  NOTIFICATION_CATEGORIES,
  type NotificationPreferenceEntry,
  type NotificationPreferencesContextValue,
  useNotificationPreferences,
} from "./NotificationPreferencesProvider";

function CapturePreferences({
  onValue,
}: {
  onValue: (value: NotificationPreferencesContextValue) => void;
}) {
  const value = useNotificationPreferences();

  useEffect(() => {
    onValue(value);
  }, [onValue, value]);

  return null;
}

const defaultEntries: NotificationPreferenceEntry[] = NOTIFICATION_CATEGORIES.map((category) => ({
  category,
  enabled: true,
}));

describe("NotificationPreferencesProvider", () => {
  const sessionState = { token: null as SessionToken | null };

  beforeEach(() => {
    sessionState.token = null;
    useSessionMock.mockImplementation(() => ({ sessionToken: sessionState.token }));
    fetchQueryMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    useSessionMock.mockReset();
  });

  it("loads preferences when a session token becomes available", async () => {
    fetchQueryMock.mockReturnValue({
      toPromise: () => Promise.resolve({ notificationPreferences: { entries: [] } }),
    });
    const stateListener = vi.fn();

    const { rerender } = render(
      <NotificationPreferencesProvider>
        <CapturePreferences onValue={stateListener} />
      </NotificationPreferencesProvider>,
    );

    expect(fetchQueryMock).not.toHaveBeenCalled();

    sessionState.token = { accessToken: "token" };

    rerender(
      <NotificationPreferencesProvider>
        <CapturePreferences onValue={stateListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      expect(fetchQueryMock).toHaveBeenCalledTimes(1);
    });
  });

  it("resets to default preferences when the session token is cleared", async () => {
    fetchQueryMock.mockReturnValue({
      toPromise: () =>
        Promise.resolve({
          notificationPreferences: {
            entries: [
              {
                category: "POST_CREATED",
                enabled: false,
              },
            ],
          },
        }),
    });
    sessionState.token = { accessToken: "token" };
    useSessionMock.mockImplementation(() => ({ sessionToken: sessionState.token }));
    const stateListener = vi.fn();

    const { rerender } = render(
      <NotificationPreferencesProvider>
        <CapturePreferences onValue={stateListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      expect(
        stateListener.mock.calls.some(([value]) =>
          value.entries.some(
            (entry) => entry.category === "POST_CREATED" && entry.enabled === false,
          ),
        ),
      ).toBe(true);
    });

    fetchQueryMock.mockClear();
    sessionState.token = null;
    useSessionMock.mockImplementation(() => ({ sessionToken: sessionState.token }));

    rerender(
      <NotificationPreferencesProvider>
        <CapturePreferences onValue={stateListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      const lastCall = stateListener.mock.calls.at(-1);
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0].entries).toEqual(defaultEntries);
      expect(lastCall?.[0].isLoaded).toBe(true);
    });
    expect(fetchQueryMock).not.toHaveBeenCalled();
  });

  it("marks preferences as loading until fetched", async () => {
    sessionState.token = { accessToken: "token" };
    useSessionMock.mockImplementation(() => ({ sessionToken: sessionState.token }));
    let resolveQuery:
      | ((value: {
          notificationPreferences: { entries: NotificationPreferenceEntry[] };
        }) => void)
      | undefined;
    const queryPromise = new Promise<{
      notificationPreferences: { entries: NotificationPreferenceEntry[] };
    }>((resolve) => {
      resolveQuery = resolve;
    });
    fetchQueryMock.mockReturnValue({
      toPromise: () => queryPromise,
    });
    const stateListener = vi.fn();

    render(
      <NotificationPreferencesProvider>
        <CapturePreferences onValue={stateListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      expect(fetchQueryMock).toHaveBeenCalledTimes(1);
      expect(stateListener).toHaveBeenCalled();
      const lastState = stateListener.mock.calls.at(-1)?.[0];
      expect(lastState?.isLoaded).toBe(false);
    });

    expect(resolveQuery).toBeDefined();

    resolveQuery?.({
      notificationPreferences: {
        entries: [
          {
            category: "POST_CREATED",
            enabled: false,
          },
        ],
      },
    });

    await waitFor(() => {
      const lastState = stateListener.mock.calls.at(-1)?.[0];
      expect(lastState?.isLoaded).toBe(true);
      expect(lastState?.isCategoryEnabled("POST_CREATED")).toBe(false);
    });
  });

  it("falls back to default preferences when fetching fails", async () => {
    sessionState.token = { accessToken: "token" };
    useSessionMock.mockImplementation(() => ({ sessionToken: sessionState.token }));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      fetchQueryMock.mockReturnValue({
        toPromise: () => Promise.reject(new Error("network error")),
      });
      const stateListener = vi.fn();

      render(
        <NotificationPreferencesProvider>
          <CapturePreferences onValue={stateListener} />
        </NotificationPreferencesProvider>,
      );

      await waitFor(() => {
        expect(fetchQueryMock).toHaveBeenCalledTimes(1);
        expect(stateListener).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        const lastState = stateListener.mock.calls.at(-1)?.[0];
        expect(lastState?.isLoaded).toBe(true);
        expect(lastState?.loadErrorCount).toBeGreaterThan(0);
        expect(lastState?.entries).toEqual(defaultEntries);
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("starts in a loaded state when there is no session token", async () => {
    const stateListener = vi.fn();

    render(
      <NotificationPreferencesProvider>
        <CapturePreferences onValue={stateListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      expect(stateListener).toHaveBeenCalled();
      const lastState = stateListener.mock.calls.at(-1)?.[0];
      expect(lastState?.isLoaded).toBe(true);
      expect(lastState?.entries).toEqual(defaultEntries);
    });
  });
});
