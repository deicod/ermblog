import type { OidcConfig } from "../config/oidcConfig";
import type { SessionToken } from "./tokenStorage";

const PENDING_AUTH_STORAGE_KEY = "erm.oidc.pendingAuth";
const DEFAULT_CODE_VERIFIER_BYTES = 32;
const STATE_BYTES = 16;

export interface AuthorizationRequest {
  url: string;
  state: string;
}

export interface PendingAuthorization {
  codeVerifier: string;
  state: string;
}

export interface OidcClientDependencies {
  fetchImplementation?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  crypto?: Crypto;
}

export interface ExchangeCodeOptions {
  code: string;
  state?: string | null;
  signal?: AbortSignal;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64 = (() => {
    if (typeof globalThis.btoa === "function") {
      return globalThis.btoa(binary);
    }

    const maybeBuffer = (globalThis as typeof globalThis & {
      Buffer?: { from(data: Uint8Array): { toString(encoding: "base64"): string } };
    }).Buffer;

    if (maybeBuffer) {
      return maybeBuffer.from(bytes).toString("base64");
    }

    throw new Error("Base64 encoding is not supported in this environment.");
  })();

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getCrypto(dependencies: OidcClientDependencies): Crypto {
  const crypto = dependencies.crypto ?? globalThis.crypto;

  if (!crypto || typeof crypto.getRandomValues !== "function") {
    throw new Error("A cryptographic random source is required for PKCE.");
  }

  if (!crypto.subtle || typeof crypto.subtle.digest !== "function") {
    throw new Error("The runtime must provide SubtleCrypto support for PKCE.");
  }

  return crypto;
}

async function createCodeVerifier(crypto: Crypto): Promise<string> {
  const randomBytes = new Uint8Array(DEFAULT_CODE_VERIFIER_BYTES);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

async function createCodeChallenge(crypto: Crypto, verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const encodedVerifier = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encodedVerifier);
  return base64UrlEncode(new Uint8Array(digest));
}

function createState(crypto: Crypto): string {
  const randomBytes = new Uint8Array(STATE_BYTES);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

function getStorage(
  dependencies: OidcClientDependencies,
): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  if (dependencies.storage) {
    return dependencies.storage;
  }

  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage) {
        return window.sessionStorage;
      }
    } catch {
      // Ignore fallthrough.
    }
  }

  throw new Error("Session storage is required to coordinate the PKCE flow.");
}

function getFetch(dependencies: OidcClientDependencies): typeof fetch {
  if (dependencies.fetchImplementation) {
    return dependencies.fetchImplementation;
  }

  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }

  throw new Error("A fetch implementation must be provided for the OIDC client.");
}

function readPendingAuthorization(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): PendingAuthorization | null {
  try {
    const raw = storage.getItem(PENDING_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PendingAuthorization>;

    if (
      !parsed ||
      typeof parsed.codeVerifier !== "string" ||
      parsed.codeVerifier.length === 0 ||
      typeof parsed.state !== "string" ||
      parsed.state.length === 0
    ) {
      return null;
    }

    return {
      codeVerifier: parsed.codeVerifier,
      state: parsed.state,
    };
  } catch {
    return null;
  }
}

function persistPendingAuthorization(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  pending: PendingAuthorization,
): void {
  try {
    storage.setItem(PENDING_AUTH_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Ignore persistence failures. The login route will surface an error when the exchange fails.
  }
}

function clearPendingAuthorization(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): void {
  try {
    storage.removeItem(PENDING_AUTH_STORAGE_KEY);
  } catch {
    // Ignore removal failures to avoid breaking the flow.
  }
}

async function buildAuthorizationUrl(
  config: OidcConfig,
  crypto: Crypto,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): Promise<AuthorizationRequest> {
  const verifier = await createCodeVerifier(crypto);
  const challenge = await createCodeChallenge(crypto, verifier);
  const state = createState(crypto);

  persistPendingAuthorization(storage, { codeVerifier: verifier, state });

  const authorizationUrl = new URL(config.authorizationEndpoint);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("state", state);

  return { url: authorizationUrl.toString(), state };
}

async function exchangeAuthorizationCode(
  config: OidcConfig,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  fetchImplementation: typeof fetch,
  options: ExchangeCodeOptions,
): Promise<SessionToken> {
  const pending = readPendingAuthorization(storage);

  if (!pending) {
    throw new Error("No pending authorization request was found.");
  }

  if (options.state && pending.state && options.state !== pending.state) {
    throw new Error("The authorization response state did not match the original request.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code: options.code,
    code_verifier: pending.codeVerifier,
  });

  let response: Response;
  try {
    response = await fetchImplementation(config.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: options.signal,
    });
  } catch (error) {
    throw new Error("Failed to reach the OIDC token endpoint.", { cause: error });
  }

  let payloadText = "";
  try {
    payloadText = await response.text();
  } catch (error) {
    throw new Error("Failed to read the OIDC token response.", { cause: error });
  } finally {
    clearPendingAuthorization(storage);
  }

  let payload: Record<string, unknown> = {};
  if (payloadText.trim().length > 0) {
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch (error) {
      throw new Error("Failed to parse the OIDC token response.", { cause: error });
    }
  }

  if (!response.ok) {
    const description = typeof payload.error_description === "string" ? payload.error_description : undefined;
    const errorCode = typeof payload.error === "string" ? payload.error : response.statusText;
    const message = description ? `${errorCode}: ${description}` : `Token endpoint responded with ${response.status}.`;
    throw new Error(message);
  }

  const accessToken = payload.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("The token response did not include an access token.");
  }

  const tokenType = typeof payload.token_type === "string" && payload.token_type.length > 0 ? payload.token_type : undefined;

  return { accessToken, tokenType };
}

export interface OidcClient {
  initiateAuthorization(): Promise<AuthorizationRequest>;
  exchangeCodeForToken(options: ExchangeCodeOptions): Promise<SessionToken>;
  clearPendingAuthorization(): void;
  getPendingAuthorization(): PendingAuthorization | null;
}

export function createOidcClient(
  config: OidcConfig,
  dependencies: OidcClientDependencies = {},
): OidcClient {
  const crypto = getCrypto(dependencies);
  const storage = getStorage(dependencies);
  const fetchImplementation = getFetch(dependencies);

  return {
    async initiateAuthorization() {
      return buildAuthorizationUrl(config, crypto, storage);
    },
    async exchangeCodeForToken(options) {
      return exchangeAuthorizationCode(config, storage, fetchImplementation, options);
    },
    clearPendingAuthorization() {
      clearPendingAuthorization(storage);
    },
    getPendingAuthorization() {
      return readPendingAuthorization(storage);
    },
  };
}
