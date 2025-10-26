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
  useNotificationPreferences,
} from "./NotificationPreferencesProvider";

function CaptureEntries({ onEntries }: { onEntries: (entries: NotificationPreferenceEntry[]) => void }) {
  const { entries } = useNotificationPreferences();

  useEffect(() => {
    onEntries(entries);
  }, [entries, onEntries]);

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
    const entriesListener = vi.fn();

    const { rerender } = render(
      <NotificationPreferencesProvider>
        <CaptureEntries onEntries={entriesListener} />
      </NotificationPreferencesProvider>,
    );

    expect(fetchQueryMock).not.toHaveBeenCalled();

    sessionState.token = { accessToken: "token" };

    rerender(
      <NotificationPreferencesProvider>
        <CaptureEntries onEntries={entriesListener} />
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
    const entriesListener = vi.fn();

    const { rerender } = render(
      <NotificationPreferencesProvider>
        <CaptureEntries onEntries={entriesListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      expect(
        entriesListener.mock.calls.some(([entries]) =>
          entries.some(
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
        <CaptureEntries onEntries={entriesListener} />
      </NotificationPreferencesProvider>,
    );

    await waitFor(() => {
      const lastCall = entriesListener.mock.calls.at(-1);
      expect(lastCall).toBeDefined();
      expect(lastCall?.[0]).toEqual(defaultEntries);
    });
    expect(fetchQueryMock).not.toHaveBeenCalled();
  });
});
