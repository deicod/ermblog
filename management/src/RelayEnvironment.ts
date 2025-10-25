import { Environment, Network, RecordSource, Store } from "relay-runtime";
import type {
  CacheConfig,
  Disposable,
  FetchFunction,
  GraphQLResponse,
  LegacyObserver,
  RequestParameters,
  SubscribeFunction,
  Variables,
} from "relay-runtime";
import { createClient, type Client, type ClientOptions, type Sink } from "graphql-ws";

import {
  resolveRelayEnvironmentConfig,
  type RelayEnvironmentConfig,
} from "./config/relayEnvironmentConfig";
import {
  browserSessionTokenStorage,
  type SessionToken,
  type SessionTokenStorage,
} from "./session/tokenStorage";
import { dispatchSessionUnauthorized } from "./session/sessionEvents";

export interface RelayFetchOptions {
  endpoint?: string;
  fetchImplementation?: typeof fetch;
  tokenStorage?: SessionTokenStorage;
  maxRetries?: number;
  retryDelayMs?: number;
  authorizationHeaderFormatter?: (token: SessionToken) => string;
  onUnauthorized?: (error: unknown, status?: number) => void;
}

export interface CreateRelayEnvironmentOptions {
  fetchConfig?: RelayFetchOptions;
  subscribe?: SubscribeFunction;
  subscribeConfig?: RelaySubscribeOptions;
  store?: Store;
}

export interface RelaySubscribeOptions {
  endpoint?: string;
  connectionParams?: ClientOptions["connectionParams"];
  webSocketImpl?: ClientOptions["webSocketImpl"];
  lazy?: ClientOptions["lazy"];
  maxRetries?: number;
  retryDelayMs?: number;
  clientFactory?: (options: ClientOptions) => Client;
}

export class RelayNetworkError extends Error {
  status?: number;
  body?: unknown;

  constructor(
    message: string,
    options: { status?: number; body?: unknown; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "RelayNetworkError";
    this.status = options.status;
    this.body = options.body;

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

const ACCEPT_HEADER =
  "application/graphql-response+json; charset=utf-8, application/json; charset=utf-8";

const defaultAuthorizationFormatter = (token: SessionToken): string => {
  const scheme = token.tokenType?.trim();

  if (scheme) {
    return `${scheme} ${token.accessToken}`;
  }

  return `Bearer ${token.accessToken}`;
};

async function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseGraphQLResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const rawBody = await response.text();
  const payloadText = rawBody.trim();
  let payload: unknown = {};

  if (payloadText.length > 0) {
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch (error) {
      throw new RelayNetworkError("Failed to parse GraphQL response payload.", {
        status: response.status,
        body: payloadText,
        cause: error,
      });
    }
  }

  if (!response.ok) {
    throw new RelayNetworkError(
      `GraphQL request failed with status ${response.status}`,
      {
        status: response.status,
        body: payload,
      },
    );
  }

  return payload as Record<string, unknown>;
}

function resolveFetchOptions(
  options: RelayFetchOptions,
  runtimeConfig: RelayEnvironmentConfig,
) {
  return {
    endpoint: options.endpoint ?? runtimeConfig.httpEndpoint,
    fetchImplementation: options.fetchImplementation ?? globalThis.fetch,
    tokenStorage: options.tokenStorage ?? browserSessionTokenStorage,
    maxRetries: options.maxRetries ?? runtimeConfig.maxRetries,
    retryDelayMs: options.retryDelayMs ?? runtimeConfig.retryDelayMs,
    authorizationHeaderFormatter:
      options.authorizationHeaderFormatter ?? defaultAuthorizationFormatter,
    onUnauthorized: options.onUnauthorized,
  };
}

interface RelaySubscribeResolvedOptions {
  endpoint: string;
  connectionParams?: ClientOptions["connectionParams"];
  webSocketImpl?: ClientOptions["webSocketImpl"];
  lazy: ClientOptions["lazy"];
  maxRetries: number;
  retryDelayMs: number;
  clientFactory: (options: ClientOptions) => Client;
}

function resolveSubscribeOptions(
  options: RelaySubscribeOptions,
  runtimeConfig: RelayEnvironmentConfig,
): RelaySubscribeResolvedOptions {
  return {
    endpoint: options.endpoint ?? runtimeConfig.wsEndpoint,
    connectionParams: options.connectionParams,
    webSocketImpl:
      options.webSocketImpl ?? (typeof WebSocket !== "undefined" ? WebSocket : undefined),
    lazy: options.lazy ?? true,
    maxRetries: options.maxRetries ?? runtimeConfig.wsMaxRetries,
    retryDelayMs: options.retryDelayMs ?? runtimeConfig.wsRetryDelayMs,
    clientFactory: options.clientFactory ?? createClient,
  };
}

function extractStatus(error: unknown): number | undefined {
  if (error instanceof RelayNetworkError) {
    return error.status;
  }

  if (typeof Response !== "undefined" && error instanceof Response) {
    return error.status;
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    const candidate = (error as { status?: unknown }).status;
    return typeof candidate === "number" ? candidate : undefined;
  }

  return undefined;
}

export const createFetchFn = (
  options: RelayFetchOptions = {},
): FetchFunction => {
  const runtimeConfig = resolveRelayEnvironmentConfig();
  const {
    endpoint,
    fetchImplementation,
    tokenStorage,
    maxRetries,
    retryDelayMs,
    authorizationHeaderFormatter,
    onUnauthorized,
  } = resolveFetchOptions(options, runtimeConfig);

  if (typeof endpoint !== "string" || endpoint.length === 0) {
    throw new RelayNetworkError("A GraphQL HTTP endpoint must be provided.");
  }

  const totalAttempts = Math.max(0, maxRetries) + 1;

  return async (request, variables) => {
    if (!request.text) {
      throw new RelayNetworkError("The Relay request is missing a GraphQL query.");
    }

    const activeFetch =
      typeof fetchImplementation === "function"
        ? fetchImplementation
        : typeof globalThis.fetch === "function"
          ? globalThis.fetch
          : undefined;

    if (typeof activeFetch !== "function") {
      throw new RelayNetworkError(
        "A fetch implementation must be supplied for the Relay network.",
      );
    }

    let lastError: unknown;

    const reportUnauthorized =
      typeof onUnauthorized === "function"
        ? onUnauthorized
        : (error: unknown, status?: number) => {
            dispatchSessionUnauthorized({
              status: typeof status === "number" ? status : 401,
              reason: error,
            });
          };

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      try {
        const headers: Record<string, string> = {
          Accept: ACCEPT_HEADER,
          "Content-Type": "application/json",
        };

        const sessionToken = tokenStorage?.getSessionToken?.();

        if (sessionToken?.accessToken) {
          headers.Authorization = authorizationHeaderFormatter(sessionToken);
        }

        const response = await activeFetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: request.text,
            variables,
          }),
        });

        return await parseGraphQLResponse(response);
      } catch (error) {
        lastError = error;
        const status = extractStatus(error);

        if (status === 401) {
          reportUnauthorized(error, status);
        }

        const shouldRetry =
          attempt < totalAttempts - 1 &&
          (status === undefined || (status >= 500 && status < 600));

        if (!shouldRetry) {
          throw error;
        }

        await delay(retryDelayMs);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new RelayNetworkError("GraphQL request failed.");
  };
};

function toDisposable(cleanup: () => void): Disposable {
  return {
    dispose: cleanup,
  };
}

function ensureGraphQLText(request: RequestParameters): string {
  if (!request.text) {
    throw new RelayNetworkError("The Relay request is missing a GraphQL query.");
  }

  return request.text;
}

function forwardToObserver(
  observer: LegacyObserver<GraphQLResponse> | undefined,
): Sink<GraphQLResponse> {
  return {
    next: (response) => observer?.next?.(response),
    error: (error) => observer?.error?.(error),
    complete: () => observer?.complete?.(),
  };
}

export const createSubscribeFn = (
  options: RelaySubscribeOptions = {},
): SubscribeFunction => {
  const runtimeConfig = resolveRelayEnvironmentConfig();
  const resolved = resolveSubscribeOptions(options, runtimeConfig);

  let client: Client | null = null;

  const getClient = (): Client => {
    if (client) {
      return client;
    }

    if (typeof resolved.endpoint !== "string" || resolved.endpoint.length === 0) {
      throw new RelayNetworkError("A GraphQL WebSocket endpoint must be provided.");
    }

    if (!resolved.webSocketImpl) {
      throw new RelayNetworkError(
        "A WebSocket implementation must be provided for GraphQL subscriptions.",
      );
    }

    client = resolved.clientFactory({
      url: resolved.endpoint,
      connectionParams: resolved.connectionParams,
      lazy: resolved.lazy,
      retryAttempts: Math.max(0, resolved.maxRetries),
      retryWait: async () => {
        if (resolved.retryDelayMs > 0) {
          await delay(resolved.retryDelayMs);
        }
      },
      webSocketImpl: resolved.webSocketImpl,
    });

    return client;
  };

  return (
    request: RequestParameters,
    variables: Variables,
    _cacheConfig: CacheConfig,
    observer?: LegacyObserver<GraphQLResponse>,
  ) => {
    const queryText = ensureGraphQLText(request);
    const activeClient = getClient();

    const cleanup = activeClient.subscribe(
      {
        query: queryText,
        operationName: request.name,
        variables,
      },
      forwardToObserver(observer),
    );

    return toDisposable(cleanup);
  };
};

export function createRelayEnvironment(
  options: CreateRelayEnvironmentOptions = {},
) {
  const runtimeConfig = resolveRelayEnvironmentConfig();
  const fetchFn = createFetchFn({
    ...options.fetchConfig,
    endpoint: options.fetchConfig?.endpoint ?? runtimeConfig.httpEndpoint,
    maxRetries: options.fetchConfig?.maxRetries ?? runtimeConfig.maxRetries,
    retryDelayMs:
      options.fetchConfig?.retryDelayMs ?? runtimeConfig.retryDelayMs,
  });

  const subscribeFn =
    options.subscribe ??
    (options.subscribeConfig
      ? createSubscribeFn({
          ...options.subscribeConfig,
          endpoint:
            options.subscribeConfig.endpoint ?? runtimeConfig.wsEndpoint,
          maxRetries:
            options.subscribeConfig.maxRetries ?? runtimeConfig.wsMaxRetries,
          retryDelayMs:
            options.subscribeConfig.retryDelayMs ?? runtimeConfig.wsRetryDelayMs,
        })
      : createSubscribeFn({
          endpoint: runtimeConfig.wsEndpoint,
          maxRetries: runtimeConfig.wsMaxRetries,
          retryDelayMs: runtimeConfig.wsRetryDelayMs,
        }));

  return new Environment({
    network: Network.create(fetchFn, subscribeFn),
    store: options.store ?? new Store(new RecordSource()),
  });
}
