import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  useLazyLoadQueryMock,
  useMutationMock,
  useNotificationPreferencesMock,
  useToastMock,
} = vi.hoisted(() => ({
  useLazyLoadQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  useNotificationPreferencesMock: vi.fn(),
  useToastMock: vi.fn(),
}));

vi.mock("react-relay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-relay")>();
  return {
    __esModule: true,
    ...actual,
    useLazyLoadQuery: useLazyLoadQueryMock,
    useMutation: useMutationMock,
  };
});

vi.mock("../../../providers/NotificationPreferencesProvider", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../../providers/NotificationPreferencesProvider")
  >();
  return {
    __esModule: true,
    ...actual,
    useNotificationPreferences: () => useNotificationPreferencesMock(),
  };
});

vi.mock("../../../providers/ToastProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../providers/ToastProvider")>();
  return {
    __esModule: true,
    ...actual,
    useToast: () => useToastMock(),
  };
});

import { NotificationsRoute } from "../NotificationsRoute";

describe("NotificationsRoute", () => {
  beforeEach(() => {
    useLazyLoadQueryMock.mockReturnValue({
      notificationPreferences: { entries: [] },
    });
    useMutationMock.mockReturnValue([vi.fn(), false]);
    useToastMock.mockReturnValue({ showToast: vi.fn() });
    useNotificationPreferencesMock.mockReturnValue({
      entries: [],
      isCategoryEnabled: () => true,
      setEntries: vi.fn(),
      refresh: vi.fn(() => Promise.resolve()),
      isLoaded: true,
      loadErrorCount: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("surfaces refresh errors and keeps retry interactions resilient", async () => {
    const refreshMock = vi.fn(() => Promise.reject(new Error("refresh failed")));
    useNotificationPreferencesMock.mockReturnValue({
      entries: [],
      isCategoryEnabled: () => true,
      setEntries: vi.fn(),
      refresh: refreshMock,
      isLoaded: true,
      loadErrorCount: 1,
    });

    render(<NotificationsRoute />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "We couldn't refresh your notification preferences. Please try again.",
    );

    const retryButton = screen.getByRole("button", { name: "Retry refresh" });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(alert).toHaveTextContent(
        "We couldn't refresh your notification preferences. Please try again.",
      );
    });
  });
});
