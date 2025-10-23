import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { SESSION_STORAGE_KEY, browserSessionTokenStorage } from "./tokenStorage";
import type { SessionToken } from "./tokenStorage";

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

interface DispatchOptions {
  key: string;
  newValue: string | null;
  oldValue: string | null;
}

function dispatchStorageEvent({ key, newValue, oldValue }: DispatchOptions): void {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof StorageEvent === "function") {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue,
        oldValue,
        storageArea: window.sessionStorage,
      }),
    );
    return;
  }

  if (
    typeof document !== "undefined" &&
    typeof document.createEvent === "function"
  ) {
    const event = document.createEvent("StorageEvent");
    event.initStorageEvent(
      "storage",
      false,
      false,
      key,
      oldValue,
      newValue,
      typeof window.location !== "undefined" ? window.location.href : "",
      window.sessionStorage,
    );
    window.dispatchEvent(event);
    return;
  }

  window.dispatchEvent(new Event("storage"));
}

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [sessionToken, setSessionToken] = useState<SessionToken | null>(() =>
    readSessionToken(),
  );

  const persistSessionToken = useCallback((token: SessionToken) => {
    setSessionToken(token);

    if (typeof window === "undefined" || !window.sessionStorage) {
      return;
    }

    try {
      const serialized = JSON.stringify(token);
      const previousValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      dispatchStorageEvent({
        key: SESSION_STORAGE_KEY,
        newValue: serialized,
        oldValue: previousValue,
      });
    } catch {
      // Ignore persistence errors to avoid breaking the app flow.
    }
  }, []);

  const clearSessionToken = useCallback(() => {
    setSessionToken(null);

    if (typeof window === "undefined" || !window.sessionStorage) {
      return;
    }

    try {
      const previousValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      dispatchStorageEvent({
        key: SESSION_STORAGE_KEY,
        newValue: null,
        oldValue: previousValue,
      });
    } catch {
      // Ignore persistence errors to avoid breaking the app flow.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) {
        return;
      }

      setSessionToken(readSessionToken());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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
};

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
