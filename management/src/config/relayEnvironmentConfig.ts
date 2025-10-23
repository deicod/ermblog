export const DEFAULT_GRAPHQL_HTTP_ENDPOINT = "http://localhost:8080/graphql";
export const DEFAULT_GRAPHQL_MAX_RETRIES = 1;
export const DEFAULT_GRAPHQL_RETRY_DELAY_MS = 250;

type EnvSource = Partial<Record<string, string | undefined>>;

const GRAPHQL_ENDPOINT_KEY = "VITE_GRAPHQL_HTTP_ENDPOINT";
const GRAPHQL_MAX_RETRIES_KEY = "VITE_GRAPHQL_HTTP_MAX_RETRIES";
const GRAPHQL_RETRY_DELAY_KEY = "VITE_GRAPHQL_HTTP_RETRY_DELAY_MS";

export interface RelayEnvironmentConfig {
  httpEndpoint: string;
  maxRetries: number;
  retryDelayMs: number;
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

  return {
    httpEndpoint,
    maxRetries,
    retryDelayMs,
  };
}

export type { EnvSource as RelayEnvironmentEnvSource };
