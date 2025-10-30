import { describe, expect, it } from "vitest";

import {
  DEFAULT_GRAPHQL_HTTP_ENDPOINT,
  DEFAULT_GRAPHQL_MAX_RETRIES,
  DEFAULT_GRAPHQL_RETRY_DELAY_MS,
  DEFAULT_GRAPHQL_WS_ENDPOINT,
  DEFAULT_GRAPHQL_WS_MAX_RETRIES,
  DEFAULT_GRAPHQL_WS_RETRY_DELAY_MS,
  resolveRelayEnvironmentConfig,
} from "./relayEnvironmentConfig";

describe("resolveRelayEnvironmentConfig", () => {
  it("falls back to defaults when environment variables are absent", () => {
    const config = resolveRelayEnvironmentConfig({});

    expect(config.httpEndpoint).toBe(DEFAULT_GRAPHQL_HTTP_ENDPOINT);
    expect(config.maxRetries).toBe(DEFAULT_GRAPHQL_MAX_RETRIES);
    expect(config.retryDelayMs).toBe(DEFAULT_GRAPHQL_RETRY_DELAY_MS);
    expect(config.wsEndpoint).toBe(DEFAULT_GRAPHQL_WS_ENDPOINT);
    expect(config.wsMaxRetries).toBe(DEFAULT_GRAPHQL_WS_MAX_RETRIES);
    expect(config.wsRetryDelayMs).toBe(DEFAULT_GRAPHQL_WS_RETRY_DELAY_MS);
    expect(config.subscriptionsEnabled).toBe(false);
  });

  it("derives a websocket endpoint from an http endpoint when none is provided", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_HTTP_ENDPOINT: "http://example.test/graphql",
    });

    expect(config.wsEndpoint).toBe("ws://example.test/graphql");
  });

  it("upgrades https http endpoints to secure websocket endpoints", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_HTTP_ENDPOINT: "https://example.test/graphql",
    });

    expect(config.wsEndpoint).toBe("wss://example.test/graphql");
  });

  it("uses provided environment variables when present", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_HTTP_ENDPOINT: "https://example.test/graphql",
      VITE_GRAPHQL_HTTP_MAX_RETRIES: "3",
      VITE_GRAPHQL_HTTP_RETRY_DELAY_MS: "400",
      VITE_GRAPHQL_WS_ENDPOINT: "wss://override.test/graphql",
      VITE_GRAPHQL_WS_MAX_RETRIES: "7",
      VITE_GRAPHQL_WS_RETRY_DELAY_MS: "1200",
      VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED: "true",
    });

    expect(config.httpEndpoint).toBe("https://example.test/graphql");
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelayMs).toBe(400);
    expect(config.wsEndpoint).toBe("wss://override.test/graphql");
    expect(config.wsMaxRetries).toBe(7);
    expect(config.wsRetryDelayMs).toBe(1200);
    expect(config.subscriptionsEnabled).toBe(true);
  });

  it("disables subscriptions when the environment explicitly opts out", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED: "false",
    });

    expect(config.subscriptionsEnabled).toBe(false);
  });

  it("ignores invalid numeric overrides", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_HTTP_ENDPOINT: "https://example.test/graphql",
      VITE_GRAPHQL_HTTP_MAX_RETRIES: "-5",
      VITE_GRAPHQL_HTTP_RETRY_DELAY_MS: "invalid",
      VITE_GRAPHQL_WS_MAX_RETRIES: "-2",
      VITE_GRAPHQL_WS_RETRY_DELAY_MS: "",
      VITE_GRAPHQL_SUBSCRIPTIONS_ENABLED: "not-a-boolean",
    });

    expect(config.httpEndpoint).toBe("https://example.test/graphql");
    expect(config.maxRetries).toBe(DEFAULT_GRAPHQL_MAX_RETRIES);
    expect(config.retryDelayMs).toBe(DEFAULT_GRAPHQL_RETRY_DELAY_MS);
    expect(config.wsEndpoint).toBe("wss://example.test/graphql");
    expect(config.wsMaxRetries).toBe(DEFAULT_GRAPHQL_WS_MAX_RETRIES);
    expect(config.wsRetryDelayMs).toBe(DEFAULT_GRAPHQL_WS_RETRY_DELAY_MS);
    expect(config.subscriptionsEnabled).toBe(false);
  });
});
