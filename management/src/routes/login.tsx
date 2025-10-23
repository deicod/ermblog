import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { resolveOidcConfig } from "../config/oidcConfig";
import { createOidcClient } from "../session/oidcClient";
import { useAuthActions, useSession } from "../session/SessionProvider";
import { browserSessionTokenStorage } from "../session/tokenStorage";

type LoginStatus =
  | "idle"
  | "redirecting"
  | "exchanging"
  | "authenticated"
  | "error";

function parseParams(value: string): URLSearchParams {
  if (!value) {
    return new URLSearchParams();
  }

  const trimmed = value.startsWith("?") || value.startsWith("#") ? value.slice(1) : value;
  return new URLSearchParams(trimmed);
}

function extractErrorMessage(code: string | null, description: string | null): string {
  if (description) {
    return description;
  }

  if (code) {
    return `Login failed: ${code}`;
  }

  return "Login failed. Please try again.";
}

export function LoginRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionToken } = useSession();
  const { persistSessionToken, clearSessionToken } = useAuthActions();

  const { config, configError } = useMemo(() => {
    try {
      const resolved = resolveOidcConfig();
      return { config: resolved, configError: null as string | null };
    } catch (error) {
      return {
        config: null,
        configError:
          error instanceof Error
            ? error.message
            : "OIDC configuration is missing required values.",
      };
    }
  }, []);

  const searchParams = useMemo(
    () => parseParams(location.search),
    [location.search],
  );
  const hashParams = useMemo(
    () => parseParams(location.hash),
    [location.hash],
  );

  const code = searchParams.get("code") ?? hashParams.get("code");
  const state = searchParams.get("state") ?? hashParams.get("state");
  const errorParam = searchParams.get("error") ?? hashParams.get("error");
  const errorDescription =
    searchParams.get("error_description") ?? hashParams.get("error_description");

  const [status, setStatus] = useState<LoginStatus>(
    sessionToken ? "authenticated" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [oidcClient, setOidcClient] = useState(() => {
    if (!config) {
      return null;
    }

    try {
      return createOidcClient(config);
    } catch {
      return null;
    }
  });
  const [clientInitError, setClientInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) {
      setOidcClient(null);
      return;
    }

    try {
      setOidcClient(createOidcClient(config));
      setClientInitError(null);
    } catch (error) {
      setOidcClient(null);
      setClientInitError(
        error instanceof Error
          ? error.message
          : "Failed to initialise the OIDC client.",
      );
    }
  }, [config]);

  const beginAuthorization = useCallback(async () => {
    if (!oidcClient) {
      if (clientInitError) {
        setStatus("error");
        setErrorMessage(clientInitError);
      }
      return;
    }

    setStatus("redirecting");
    setErrorMessage(null);

    try {
      const { url } = await oidcClient.initiateAuthorization();
      if (typeof window !== "undefined" && typeof window.location?.assign === "function") {
        window.location.assign(url);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to start the login flow. Please try again.",
      );
    }
  }, [clientInitError, oidcClient]);

  useEffect(() => {
    if (!oidcClient) {
      if (!config) {
        setStatus("error");
        setErrorMessage(configError ?? "OIDC configuration is not available.");
      } else if (clientInitError) {
        setStatus("error");
        setErrorMessage(clientInitError);
      }
      return;
    }

    if (errorParam) {
      oidcClient.clearPendingAuthorization();
      setStatus("error");
      setErrorMessage(extractErrorMessage(errorParam, errorDescription));
      return;
    }

    if (code) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      let cancelled = false;

      setStatus("exchanging");
      setErrorMessage(null);

      oidcClient
        .exchangeCodeForToken({
          code,
          state,
          signal: controller?.signal,
        })
        .then((token) => {
          if (cancelled) {
            return;
          }

          browserSessionTokenStorage.setSessionToken(token);
          persistSessionToken(token);
          setStatus("authenticated");
          setErrorMessage(null);
          navigate("/login", { replace: true });
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setStatus("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to complete the login flow. Please try again.",
          );
        })
        .finally(() => {
          if (!cancelled) {
            oidcClient.clearPendingAuthorization();
          }
        });

      return () => {
        cancelled = true;
        controller?.abort();
      };
    }

    if (!sessionToken) {
      beginAuthorization();
      return;
    }

    setStatus("authenticated");
    setErrorMessage(null);
  }, [
    beginAuthorization,
    code,
    config,
    configError,
    clientInitError,
    errorDescription,
    errorParam,
    navigate,
    oidcClient,
    persistSessionToken,
    sessionToken,
    state,
  ]);

  const handleLogout = useCallback(() => {
    browserSessionTokenStorage.setSessionToken(null);
    clearSessionToken();
    setStatus("idle");
    beginAuthorization();
  }, [beginAuthorization, clearSessionToken]);

  const heading = sessionToken ? "Manage your session" : "Sign in";

  return (
    <section aria-labelledby="login-heading">
      <header>
        <h2 id="login-heading">{heading}</h2>
      </header>
      {status === "error" && errorMessage ? (
        <div role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={beginAuthorization}>
            Try again
          </button>
        </div>
      ) : null}
      {status === "redirecting" ? (
        <p role="status">Starting login flow…</p>
      ) : null}
      {status === "exchanging" ? (
        <p role="status">Completing login…</p>
      ) : null}
      {status === "authenticated" && sessionToken ? (
        <div>
          <p>You are signed in.</p>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      ) : null}
      {status === "idle" && !sessionToken ? (
        <div>
          <p>You are not signed in.</p>
          <button type="button" onClick={beginAuthorization}>
            Sign in
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default LoginRoute;
