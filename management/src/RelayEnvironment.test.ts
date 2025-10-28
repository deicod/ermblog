const graphqlWsMocks = vi.hoisted(() => {
  const cleanupMock = vi.fn();
  const subscribeMock = vi
    .fn<
      [
        { query: string; operationName: string; variables: Record<string, unknown> },
        { next: (value: unknown) => void; error: (error: unknown) => void; complete: () => void },
      ],
      () => void
    >()
    .mockImplementation((_payload, sink) => {
      sink.complete();
      return cleanupMock;
    });

  const createClientMock = vi.fn(() => ({ subscribe: subscribeMock }));

  return {
    cleanupMock,
    subscribeMock,
    createClientMock,
  };
});

vi.mock("graphql-ws", () => ({
  createClient: graphqlWsMocks.createClientMock,
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Network } from "relay-runtime";

import {
  RelayNetworkError,
  createFetchFn,
  createRelayEnvironment,
  createSubscribeFn,
} from "./RelayEnvironment";
import type { SessionTokenStorage } from "./session/tokenStorage";
import { SESSION_UNAUTHORIZED_EVENT } from "./session/sessionEvents";

class MockWebSocket {}

beforeEach(() => {
  graphqlWsMocks.cleanupMock.mockReset();
  graphqlWsMocks.subscribeMock.mockReset();
  graphqlWsMocks.subscribeMock.mockImplementation((_payload, sink) => {
    sink.complete();
    return graphqlWsMocks.cleanupMock;
  });
  graphqlWsMocks.createClientMock.mockReset();
  graphqlWsMocks.createClientMock.mockImplementation(() => ({
    subscribe: graphqlWsMocks.subscribeMock,
  }));
});

describe("createFetchFn", () => {
  const request = { text: "query Example($id: ID!) { node(id: $id) { id } }" } as const;
  const variables = { id: "example" };

  const okResponse = (body: unknown) => ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  });

  it("injects the authorization header from the session token storage", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(okResponse({ data: { node: { id: "example" } } }));

    const tokenStorage: SessionTokenStorage = {
      getSessionToken: () => ({ accessToken: "token-value", tokenType: "Bearer" }),
    };

    const fetchFn = createFetchFn({
      endpoint: "https://example.test/graphql",
      fetchImplementation: fetchSpy as unknown as typeof fetch,
      tokenStorage,
      maxRetries: 0,
    });

    await fetchFn(request as never, variables);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.test/graphql",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-value",
        }),
      }),
    );
  });

  it("retries when fetch rejects before succeeding", async () => {
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network error"))
      .mockResolvedValueOnce(okResponse({ data: { ok: true } }));

    const fetchFn = createFetchFn({
      endpoint: "https://example.test/graphql",
      fetchImplementation: fetchSpy as unknown as typeof fetch,
      maxRetries: 2,
      retryDelayMs: 0,
    });

    const result = await fetchFn(request as never, variables);

    expect(result).toEqual({ data: { ok: true } });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("propagates network errors after exhausting retries", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(JSON.stringify({ errors: [{ message: "fail" }] })),
    });

    const fetchFn = createFetchFn({
      endpoint: "https://example.test/graphql",
      fetchImplementation: fetchSpy as unknown as typeof fetch,
      maxRetries: 1,
      retryDelayMs: 0,
    });

    await expect(fetchFn(request as never, variables)).rejects.toBeInstanceOf(
      RelayNetworkError,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("dispatches an unauthorized event when a 401 response is returned", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(JSON.stringify({ errors: [{ message: "unauthorized" }] })),
    });

    const listener = vi.fn<(event: Event) => void>();
    const eventListener = listener as unknown as EventListener;
    window.addEventListener(SESSION_UNAUTHORIZED_EVENT, eventListener);

    try {
      const fetchFn = createFetchFn({
        endpoint: "https://example.test/graphql",
        fetchImplementation: fetchSpy as unknown as typeof fetch,
        maxRetries: 0,
      });

      await expect(fetchFn(request as never, variables)).rejects.toBeInstanceOf(
        RelayNetworkError,
      );

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent<{ status?: number }>;
      expect(event.detail?.status).toBe(401);
    } finally {
      window.removeEventListener(SESSION_UNAUTHORIZED_EVENT, eventListener);
    }
  });

  it("invokes the provided unauthorized handler when supplied", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(JSON.stringify({ errors: [{ message: "unauthorized" }] })),
    });

    const onUnauthorized = vi.fn();

    const fetchFn = createFetchFn({
      endpoint: "https://example.test/graphql",
      fetchImplementation: fetchSpy as unknown as typeof fetch,
      maxRetries: 0,
      onUnauthorized,
    });

    await expect(fetchFn(request as never, variables)).rejects.toBeInstanceOf(
      RelayNetworkError,
    );

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    const [errorArg, statusArg] = onUnauthorized.mock.calls[0];
    expect(errorArg).toBeInstanceOf(RelayNetworkError);
    expect(statusArg).toBe(401);
  });

  it("uses runtime environment variables when no endpoint override is provided", async () => {
    const previousEndpoint = process.env.VITE_GRAPHQL_HTTP_ENDPOINT;
    process.env.VITE_GRAPHQL_HTTP_ENDPOINT = "https://env.example/graphql";

    try {
      const fetchSpy = vi
        .fn()
        .mockResolvedValue(okResponse({ data: { node: { id: "example" } } }));

      const fetchFn = createFetchFn({
        fetchImplementation: fetchSpy as unknown as typeof fetch,
        maxRetries: 0,
      });

      await fetchFn(request as never, variables);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://env.example/graphql",
        expect.any(Object),
      );
    } finally {
      if (previousEndpoint === undefined) {
        delete process.env.VITE_GRAPHQL_HTTP_ENDPOINT;
      } else {
        process.env.VITE_GRAPHQL_HTTP_ENDPOINT = previousEndpoint;
      }
    }
  });

  it("defers fetch availability validation until the request executes", async () => {
    const previousFetch = globalThis.fetch;
    // @ts-expect-error - simulate environments without fetch available at import time.
    globalThis.fetch = undefined;

    try {
      const fetchFn = createFetchFn({
        endpoint: "https://example.test/graphql",
        // @ts-expect-error - ensure no fetch implementation provided.
        fetchImplementation: undefined,
        maxRetries: 0,
      });

      await expect(fetchFn(request as never, variables)).rejects.toThrow(
        "A fetch implementation must be supplied for the Relay network.",
      );
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

describe("createSubscribeFn", () => {
  const request = {
    text: "subscription Example { ping }",
    name: "ExampleSubscription",
  } as const;
  const variables = { scope: "demo" };

  it("forwards subscription payloads to the graphql-ws client", async () => {
    const next = vi.fn();
    const complete = vi.fn();

    graphqlWsMocks.subscribeMock.mockImplementation((_payload, sink) => {
      sink.next({ data: { ping: true } });
      sink.complete();
      return graphqlWsMocks.cleanupMock;
    });

    const subscribeFn = createSubscribeFn({
      endpoint: "wss://example.test/graphql",
      maxRetries: 3,
      retryDelayMs: 200,
      webSocketImpl: MockWebSocket,
    });

    const disposable = subscribeFn(request as never, variables, {} as never, {
      next,
      error: vi.fn(),
      complete,
    });

    expect(graphqlWsMocks.createClientMock).toHaveBeenCalledTimes(1);
    expect(graphqlWsMocks.subscribeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: request.text,
        operationName: request.name,
        variables,
      }),
      expect.any(Object),
    );
    expect(next).toHaveBeenCalledWith({ data: { ping: true } });
    expect(complete).toHaveBeenCalledTimes(1);

    disposable.dispose();
    expect(graphqlWsMocks.cleanupMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the websocket client across subscriptions", () => {
    const subscribeFn = createSubscribeFn({
      endpoint: "wss://example.test/graphql",
      webSocketImpl: MockWebSocket,
    });

    subscribeFn(request as never, variables, {} as never);
    subscribeFn(request as never, variables, {} as never);

    expect(graphqlWsMocks.createClientMock).toHaveBeenCalledTimes(1);
  });

  it("resolves runtime configuration when explicit options are absent", async () => {
    const previousEndpoint = process.env.VITE_GRAPHQL_WS_ENDPOINT;
    const previousMaxRetries = process.env.VITE_GRAPHQL_WS_MAX_RETRIES;
    const previousRetryDelay = process.env.VITE_GRAPHQL_WS_RETRY_DELAY_MS;

    process.env.VITE_GRAPHQL_WS_ENDPOINT = "wss://env.example/graphql";
    process.env.VITE_GRAPHQL_WS_MAX_RETRIES = "9";
    process.env.VITE_GRAPHQL_WS_RETRY_DELAY_MS = "750";

    vi.useFakeTimers();

    try {
      const subscribeFn = createSubscribeFn({ webSocketImpl: MockWebSocket });
      subscribeFn(request as never, variables, {} as never);

      expect(graphqlWsMocks.createClientMock).toHaveBeenCalledTimes(1);
      const options = graphqlWsMocks.createClientMock.mock.calls[0][0];
      expect(options.url).toBe("wss://env.example/graphql");
      expect(options.retryAttempts).toBe(9);

      const waitPromise = options.retryWait?.(1);
      if (waitPromise) {
        await vi.advanceTimersByTimeAsync(750);
        await waitPromise;
      }
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();

      if (previousEndpoint === undefined) {
        delete process.env.VITE_GRAPHQL_WS_ENDPOINT;
      } else {
        process.env.VITE_GRAPHQL_WS_ENDPOINT = previousEndpoint;
      }

      if (previousMaxRetries === undefined) {
        delete process.env.VITE_GRAPHQL_WS_MAX_RETRIES;
      } else {
        process.env.VITE_GRAPHQL_WS_MAX_RETRIES = previousMaxRetries;
      }

      if (previousRetryDelay === undefined) {
        delete process.env.VITE_GRAPHQL_WS_RETRY_DELAY_MS;
      } else {
        process.env.VITE_GRAPHQL_WS_RETRY_DELAY_MS = previousRetryDelay;
      }
    }
  });

  it("throws when no websocket implementation is available", () => {
    const previousWebSocket = globalThis.WebSocket;
    // @ts-expect-error - simulate environments without a WebSocket implementation.
    delete globalThis.WebSocket;

    try {
      const subscribeFn = createSubscribeFn({
        endpoint: "wss://example.test/graphql",
      });

      expect(() =>
        subscribeFn({ name: "MissingWebSocket", text: "subscription { ping }" } as never, {}, {} as never),
      ).toThrow(RelayNetworkError);
    } finally {
      if (previousWebSocket === undefined) {
        delete globalThis.WebSocket;
      } else {
        globalThis.WebSocket = previousWebSocket;
      }
    }
  });

  it("throws when the subscription operation is missing text", () => {
    const subscribeFn = createSubscribeFn({
      endpoint: "wss://example.test/graphql",
      webSocketImpl: MockWebSocket,
    });

    expect(() =>
      subscribeFn(
        { name: "ExampleSubscription", text: undefined } as unknown as typeof request,
        variables,
        {} as never,
      ),
    ).toThrow("The Relay request is missing a GraphQL query.");
  });
});

describe("createRelayEnvironment", () => {
  it("allows subscribers to be provided for future websocket support", () => {
    const subscribe = vi.fn();
    const environment = createRelayEnvironment({
      fetchConfig: {
        endpoint: "https://example.test/graphql",
        fetchImplementation: vi
          .fn()
          .mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ data: {} })),
          }) as unknown as typeof fetch,
        maxRetries: 0,
      },
      subscribe,
    });

    expect(environment.getNetwork()).toBeDefined();
    expect(subscribe).not.toHaveBeenCalled();
  });

  const createRelayEnvironmentForTest = () =>
    createRelayEnvironment({
      fetchConfig: {
        endpoint: "https://example.test/graphql",
        fetchImplementation: vi
          .fn()
          .mockResolvedValue({
            ok: true,
            status: 200,
            text: () =>
              Promise.resolve(JSON.stringify({ data: { node: { id: "example" } } })),
          }) as unknown as typeof fetch,
        maxRetries: 0,
      },
    });

  it("omits subscription support when runtime configuration keeps subscriptions disabled by default", () => {
    const previousValue = process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    const networkCreateSpy = vi.spyOn(Network, "create");

    delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;

    try {
      createRelayEnvironmentForTest();

      expect(networkCreateSpy).toHaveBeenCalledTimes(1);
      expect(networkCreateSpy.mock.calls[0][1]).toBeUndefined();
    } finally {
      networkCreateSpy.mockRestore();

      if (previousValue === undefined) {
        delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
      } else {
        process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = previousValue;
      }
    }
  });

  it("omits subscription support when disabled via runtime configuration", () => {
    const previousValue = process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    const networkCreateSpy = vi.spyOn(Network, "create");

    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "false";

    try {
      createRelayEnvironmentForTest();

      expect(networkCreateSpy).toHaveBeenCalledTimes(1);
      expect(networkCreateSpy.mock.calls[0][1]).toBeUndefined();
    } finally {
      networkCreateSpy.mockRestore();

      if (previousValue === undefined) {
        delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
      } else {
        process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = previousValue;
      }
    }
  });

  it("enables subscription support when runtime configuration opts in", () => {
    const previousValue = process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
    const networkCreateSpy = vi.spyOn(Network, "create");

    process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = "true";

    try {
      createRelayEnvironmentForTest();

      expect(networkCreateSpy).toHaveBeenCalledTimes(1);
      expect(networkCreateSpy.mock.calls[0][1]).toEqual(expect.any(Function));
    } finally {
      networkCreateSpy.mockRestore();

      if (previousValue === undefined) {
        delete process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED;
      } else {
        process.env.VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED = previousValue;
      }
    }
  });
});
