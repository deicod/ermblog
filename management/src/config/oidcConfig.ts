const OIDC_CLIENT_ID_KEY = "VITE_OIDC_CLIENT_ID";
const OIDC_AUTHORIZATION_ENDPOINT_KEY = "VITE_OIDC_AUTHORIZATION_ENDPOINT";
const OIDC_TOKEN_ENDPOINT_KEY = "VITE_OIDC_TOKEN_ENDPOINT";
const OIDC_REDIRECT_URI_KEY = "VITE_OIDC_REDIRECT_URI";
const OIDC_SCOPE_KEY = "VITE_OIDC_SCOPE";
const OIDC_ISSUER_KEY = "VITE_OIDC_ISSUER";

export interface OidcConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scope: string;
  issuer: string;
}

type EnvSource = Partial<Record<string, string | undefined>>;

function readRuntimeEnv(): EnvSource {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env as EnvSource;
  }

  if (typeof process !== "undefined" && process?.env) {
    return process.env as EnvSource;
  }

  return {};
}

function requireString(env: EnvSource, key: string): string {
  const value = env[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required OIDC configuration value for ${key}`);
  }

  return value.trim();
}

export function resolveOidcConfig(env: EnvSource = readRuntimeEnv()): OidcConfig {
  return {
    clientId: requireString(env, OIDC_CLIENT_ID_KEY),
    authorizationEndpoint: requireString(env, OIDC_AUTHORIZATION_ENDPOINT_KEY),
    tokenEndpoint: requireString(env, OIDC_TOKEN_ENDPOINT_KEY),
    redirectUri: requireString(env, OIDC_REDIRECT_URI_KEY),
    scope: requireString(env, OIDC_SCOPE_KEY),
    issuer: requireString(env, OIDC_ISSUER_KEY),
  };
}

export type { EnvSource as OidcEnvSource };
