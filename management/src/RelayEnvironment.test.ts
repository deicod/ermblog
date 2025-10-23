import { describe, expect, it, vi } from "vitest";

import {
  RelayNetworkError,
  createFetchFn,
  createRelayEnvironment,
} from "./RelayEnvironment";
import type { SessionTokenStorage } from "./session/tokenStorage";

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
});
