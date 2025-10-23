import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  SESSION_STORAGE_KEY,
  browserSessionTokenStorage,
} from "./tokenStorage";
import type { SessionToken } from "./tokenStorage";
import { subscribeToSessionUnauthorized } from "./sessionEvents";

export interface SessionContextValue {
  sessionToken: SessionToken | null;
}

export interface AuthActionsContextValue {
  persistSessionToken: (token: SessionToken) => void;
  clearSessionToken: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);
const AuthActionsContext = createContext<AuthActionsContextValue | undefined>(
  undefined,
);

function readSessionToken(): SessionToken | null {
  return browserSessionTokenStorage.getSessionToken();
}

const SYNC_STORAGE_KEY = `${SESSION_STORAGE_KEY}.sync`;

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function notifyCrossTabChange(action: "persist" | "clear"): void {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  try {
    const payload = JSON.stringify({ action, timestamp: Date.now() });
    localStorage.setItem(SYNC_STORAGE_KEY, payload);
    localStorage.removeItem(SYNC_STORAGE_KEY);
  } catch {
    // Ignore sync errors to avoid breaking the app flow.
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [sessionToken, setSessionToken] = useState<SessionToken | null>(() =>
    readSessionToken(),
  );

  const persistSessionToken = useCallback((token: SessionToken) => {
    setSessionToken(token);

    browserSessionTokenStorage.setSessionToken(token);
    notifyCrossTabChange("persist");
  }, []);

  const clearSessionToken = useCallback(() => {
    setSessionToken(null);

    browserSessionTokenStorage.setSessionToken(null);
    notifyCrossTabChange("clear");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== SYNC_STORAGE_KEY) {
        return;
      }

      setSessionToken(readSessionToken());
    };

    const localStorage = getLocalStorage();
    if (!localStorage) {
      return undefined;
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSessionUnauthorized(() => {
      clearSessionToken();

      if (typeof window === "undefined") {
        return;
      }

      const { location, history } = window;

      if (location?.pathname === "/login") {
        return;
      }

      if (!history || typeof history.pushState !== "function") {
        return;
      }

      try {
        history.pushState(null, "", "/login");
        const popStateEvent =
          typeof PopStateEvent === "function"
            ? new PopStateEvent("popstate")
            : new Event("popstate");
        window.dispatchEvent(popStateEvent);
      } catch {
        // Ignore navigation errors to avoid breaking the app flow.
      }
    });

    return unsubscribe;
  }, [clearSessionToken]);

  const sessionValue = useMemo<SessionContextValue>(
    () => ({ sessionToken }),
    [sessionToken],
  );

  const authActionsValue = useMemo<AuthActionsContextValue>(
    () => ({ persistSessionToken, clearSessionToken }),
    [persistSessionToken, clearSessionToken],
  );

  return (
    <SessionContext.Provider value={sessionValue}>
      <AuthActionsContext.Provider value={authActionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </SessionContext.Provider>
  );
}


export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}

export function useAuthActions(): AuthActionsContextValue {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error("useAuthActions must be used within a SessionProvider");
  }

  return context;
}


