import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockEnvironment } from "relay-test-utils";
import type { GraphQLSubscriptionConfig } from "react-relay";

vi.mock("react-relay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-relay")>();
  return {
    __esModule: true,
    ...actual,
    RelayEnvironmentProvider: actual.RelayEnvironmentProvider,
    useRelayEnvironment: actual.useRelayEnvironment,
    requestSubscription: vi.fn(() => ({ dispose: vi.fn() })),
  };
});

import { RelayEnvironmentProvider, requestSubscription } from "react-relay";

import {
  NotificationPreferencesContext,
  type NotificationPreferencesContextValue,
} from "../../../providers/NotificationPreferencesProvider";
import { useNotificationSubscription } from "../useNotificationSubscription";

type TestProps = {
  category: NotificationPreferencesContextValue["entries"][number]["category"];
  config: GraphQLSubscriptionConfig<Record<string, unknown>>;
};

function TestComponent({ category, config }: TestProps) {
  useNotificationSubscription(category, config);
  return null;
}

const mockedRequestSubscription = vi.mocked(requestSubscription);

beforeEach(() => {
  mockedRequestSubscription.mockReset();
  mockedRequestSubscription.mockImplementation(() => ({ dispose: vi.fn() }));
});

afterEach(() => {
  cleanup();
  mockedRequestSubscription.mockReset();
});

describe("useNotificationSubscription", () => {
  let previousSubscriptionsSetting: string | undefined;

  beforeEach(() => {
    previousSubscriptionsSetting = process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
  });

  afterEach(() => {
    if (previousSubscriptionsSetting === undefined) {
      delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    } else {
      process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = previousSubscriptionsSetting;
    }
  });

  it("skips subscription when category is disabled", () => {
    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "true";

    const environment = createMockEnvironment();
    const preferences: NotificationPreferencesContextValue = {
      entries: [],
      isCategoryEnabled: () => false,
      setEntries: () => {},
      refresh: async () => {},
    };
    const subscriptionConfig: GraphQLSubscriptionConfig<Record<string, unknown>> = {
      subscription: {} as any,
      variables: {},
    };

    render(
      <RelayEnvironmentProvider environment={environment}>
        <NotificationPreferencesContext.Provider value={preferences}>
          <TestComponent category="POST_CREATED" config={subscriptionConfig} />
        </NotificationPreferencesContext.Provider>
      </RelayEnvironmentProvider>,
    );

    expect(mockedRequestSubscription).not.toHaveBeenCalled();
  });

  it("creates a subscription when the category is enabled", () => {
    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "true";

    const environment = createMockEnvironment();
    const preferences: NotificationPreferencesContextValue = {
      entries: [],
      isCategoryEnabled: () => true,
      setEntries: () => {},
      refresh: async () => {},
    };
    const subscriptionConfig: GraphQLSubscriptionConfig<Record<string, unknown>> = {
      subscription: {} as any,
      variables: {},
    };

    render(
      <RelayEnvironmentProvider environment={environment}>
        <NotificationPreferencesContext.Provider value={preferences}>
          <TestComponent category="POST_CREATED" config={subscriptionConfig} />
        </NotificationPreferencesContext.Provider>
      </RelayEnvironmentProvider>,
    );

    expect(mockedRequestSubscription).toHaveBeenCalledTimes(1);
    expect(mockedRequestSubscription).toHaveBeenCalledWith(environment, subscriptionConfig);
  });

  it("skips subscription when runtime configuration disables subscriptions", () => {
    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "false";

    const environment = createMockEnvironment();
    const preferences: NotificationPreferencesContextValue = {
      entries: [],
      isCategoryEnabled: () => true,
      setEntries: () => {},
      refresh: async () => {},
    };
    const subscriptionConfig: GraphQLSubscriptionConfig<Record<string, unknown>> = {
      subscription: {} as any,
      variables: {},
    };

    render(
      <RelayEnvironmentProvider environment={environment}>
        <NotificationPreferencesContext.Provider value={preferences}>
          <TestComponent category="POST_CREATED" config={subscriptionConfig} />
        </NotificationPreferencesContext.Provider>
      </RelayEnvironmentProvider>,
    );

    expect(mockedRequestSubscription).not.toHaveBeenCalled();
  });

  it("disposes the subscription on unmount", () => {
    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "true";

    const environment = createMockEnvironment();
    const dispose = vi.fn();
    mockedRequestSubscription.mockReturnValueOnce({ dispose });
    const preferences: NotificationPreferencesContextValue = {
      entries: [],
      isCategoryEnabled: () => true,
      setEntries: () => {},
      refresh: async () => {},
    };
    const subscriptionConfig: GraphQLSubscriptionConfig<Record<string, unknown>> = {
      subscription: {} as any,
      variables: {},
    };

    const { unmount } = render(
      <RelayEnvironmentProvider environment={environment}>
        <NotificationPreferencesContext.Provider value={preferences}>
          <TestComponent category="POST_CREATED" config={subscriptionConfig} />
        </NotificationPreferencesContext.Provider>
      </RelayEnvironmentProvider>,
    );

    expect(mockedRequestSubscription).toHaveBeenCalledTimes(1);
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
