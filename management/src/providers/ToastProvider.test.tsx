import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";

import {
  NotificationPreferencesContext,
  type NotificationPreferencesContextValue,
  type NotificationCategory,
} from "./NotificationPreferencesProvider";
import { ToastProvider, useToast } from "./ToastProvider";

function TestToast({ category }: { category?: NotificationCategory }) {
  const { showToast } = useToast();

  useEffect(() => {
    showToast({
      title: "Test toast",
      message: "Hello world",
      category,
    });
  }, [category, showToast]);

  return null;
}

const basePreferences: NotificationPreferencesContextValue = {
  entries: [],
  isCategoryEnabled: () => true,
  setEntries: () => {},
  refresh: async () => {},
  isLoaded: true,
};

afterEach(() => {
  cleanup();
});

describe("ToastProvider", () => {
  it("renders toasts when the category is enabled", async () => {
    render(
      <NotificationPreferencesContext.Provider value={basePreferences}>
        <ToastProvider>
          <TestToast category="POST_CREATED" />
        </ToastProvider>
      </NotificationPreferencesContext.Provider>,
    );

    expect(await screen.findByText("Hello world")).toBeInTheDocument();
  });

  it("suppresses toasts when the category is disabled", async () => {
    const preferences: NotificationPreferencesContextValue = {
      ...basePreferences,
      isCategoryEnabled: (category) => category !== "POST_CREATED",
    };

    render(
      <NotificationPreferencesContext.Provider value={preferences}>
        <ToastProvider>
          <TestToast category="POST_CREATED" />
        </ToastProvider>
      </NotificationPreferencesContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
    });
  });

  it("always renders uncategorised toasts", async () => {
    const preferences: NotificationPreferencesContextValue = {
      ...basePreferences,
      isCategoryEnabled: vi.fn(() => false),
    };

    render(
      <NotificationPreferencesContext.Provider value={preferences}>
        <ToastProvider>
          <TestToast />
        </ToastProvider>
      </NotificationPreferencesContext.Provider>,
    );

    expect(await screen.findByText("Hello world")).toBeInTheDocument();
    expect(preferences.isCategoryEnabled).not.toHaveBeenCalled();
  });

  it("suppresses categorised toasts until preferences load", async () => {
    const preferences: NotificationPreferencesContextValue = {
      ...basePreferences,
      isLoaded: false,
    };

    render(
      <NotificationPreferencesContext.Provider value={preferences}>
        <ToastProvider>
          <TestToast category="POST_CREATED" />
        </ToastProvider>
      </NotificationPreferencesContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
    });
  });
});
