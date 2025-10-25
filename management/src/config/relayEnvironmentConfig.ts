export const DEFAULT_GRAPHQL_HTTP_ENDPOINT = "http://localhost:8080/graphql";
export const DEFAULT_GRAPHQL_MAX_RETRIES = 1;
export const DEFAULT_GRAPHQL_RETRY_DELAY_MS = 250;
export const DEFAULT_GRAPHQL_WS_ENDPOINT = "ws://localhost:8080/graphql";
export const DEFAULT_GRAPHQL_WS_MAX_RETRIES = 5;
export const DEFAULT_GRAPHQL_WS_RETRY_DELAY_MS = 500;

type EnvSource = Partial<Record<string, string | undefined>>;

const GRAPHQL_ENDPOINT_KEY = "VITE_GRAPHQL_HTTP_ENDPOINT";
const GRAPHQL_MAX_RETRIES_KEY = "VITE_GRAPHQL_HTTP_MAX_RETRIES";
const GRAPHQL_RETRY_DELAY_KEY = "VITE_GRAPHQL_HTTP_RETRY_DELAY_MS";
const GRAPHQL_WS_ENDPOINT_KEY = "VITE_GRAPHQL_WS_ENDPOINT";
const GRAPHQL_WS_MAX_RETRIES_KEY = "VITE_GRAPHQL_WS_MAX_RETRIES";
const GRAPHQL_WS_RETRY_DELAY_KEY = "VITE_GRAPHQL_WS_RETRY_DELAY_MS";

export interface RelayEnvironmentConfig {
  httpEndpoint: string;
  maxRetries: number;
  retryDelayMs: number;
  wsEndpoint: string;
  wsMaxRetries: number;
  wsRetryDelayMs: number;
}

function readRuntimeEnv(): EnvSource {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env as EnvSource;
  }

  if (typeof process !== "undefined" && process?.env) {
    return process.env as EnvSource;
  }

  return {};
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export function resolveRelayEnvironmentConfig(
  env: EnvSource = readRuntimeEnv(),
): RelayEnvironmentConfig {
  const httpEndpoint = env[GRAPHQL_ENDPOINT_KEY] ?? DEFAULT_GRAPHQL_HTTP_ENDPOINT;
  const maxRetries = parseInteger(env[GRAPHQL_MAX_RETRIES_KEY], DEFAULT_GRAPHQL_MAX_RETRIES);
  const retryDelayMs = parseInteger(env[GRAPHQL_RETRY_DELAY_KEY], DEFAULT_GRAPHQL_RETRY_DELAY_MS);
  const wsEndpoint = env[GRAPHQL_WS_ENDPOINT_KEY] ?? DEFAULT_GRAPHQL_WS_ENDPOINT;
  const wsMaxRetries = parseInteger(
    env[GRAPHQL_WS_MAX_RETRIES_KEY],
    DEFAULT_GRAPHQL_WS_MAX_RETRIES,
  );
  const wsRetryDelayMs = parseInteger(
    env[GRAPHQL_WS_RETRY_DELAY_KEY],
    DEFAULT_GRAPHQL_WS_RETRY_DELAY_MS,
  );

  return {
    httpEndpoint,
    maxRetries,
    retryDelayMs,
    wsEndpoint,
    wsMaxRetries,
    wsRetryDelayMs,
  };
}

export type { EnvSource as RelayEnvironmentEnvSource };
