import { describe, expect, it } from "vitest";

import {
  DEFAULT_GRAPHQL_HTTP_ENDPOINT,
  DEFAULT_GRAPHQL_MAX_RETRIES,
  DEFAULT_GRAPHQL_RETRY_DELAY_MS,
  resolveRelayEnvironmentConfig,
} from "./relayEnvironmentConfig";

describe("resolveRelayEnvironmentConfig", () => {
  it("falls back to defaults when environment variables are absent", () => {
    const config = resolveRelayEnvironmentConfig({});

    expect(config.httpEndpoint).toBe(DEFAULT_GRAPHQL_HTTP_ENDPOINT);
    expect(config.maxRetries).toBe(DEFAULT_GRAPHQL_MAX_RETRIES);
    expect(config.retryDelayMs).toBe(DEFAULT_GRAPHQL_RETRY_DELAY_MS);
  });

  it("uses provided environment variables when present", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_HTTP_ENDPOINT: "https://example.test/graphql",
      VITE_GRAPHQL_HTTP_MAX_RETRIES: "3",
      VITE_GRAPHQL_HTTP_RETRY_DELAY_MS: "400",
    });

    expect(config.httpEndpoint).toBe("https://example.test/graphql");
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelayMs).toBe(400);
  });

  it("ignores invalid numeric overrides", () => {
    const config = resolveRelayEnvironmentConfig({
      VITE_GRAPHQL_HTTP_ENDPOINT: "https://example.test/graphql",
      VITE_GRAPHQL_HTTP_MAX_RETRIES: "-5",
      VITE_GRAPHQL_HTTP_RETRY_DELAY_MS: "invalid",
    });

    expect(config.httpEndpoint).toBe("https://example.test/graphql");
    expect(config.maxRetries).toBe(DEFAULT_GRAPHQL_MAX_RETRIES);
    expect(config.retryDelayMs).toBe(DEFAULT_GRAPHQL_RETRY_DELAY_MS);
  });
});
