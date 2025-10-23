export const SESSION_STORAGE_KEY = "erm.sessionToken";

export interface SessionToken {
  accessToken: string;
  tokenType?: string;
}

export interface SessionTokenStorage {
  getSessionToken(): SessionToken | null;
  setSessionToken(token: SessionToken | null): void;
}

function parseStoredToken(serialized: string | null): SessionToken | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<SessionToken>;
    if (!parsed || typeof parsed.accessToken !== "string") {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : undefined,
    };
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export const browserSessionTokenStorage: SessionTokenStorage = {
  getSessionToken(): SessionToken | null {
    const storage = getSessionStorage();
    if (!storage) {
      return null;
    }

    try {
      const stored = storage.getItem(SESSION_STORAGE_KEY);
      return parseStoredToken(stored);
    } catch {
      return null;
    }
  },
  setSessionToken(token: SessionToken | null): void {
    const storage = getSessionStorage();
    if (!storage) {
      return;
    }

    try {
      if (!token) {
        storage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      const serialized = JSON.stringify(token);
      storage.setItem(SESSION_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage persistence failures to avoid breaking the login flow.
    }
  },
};

export { parseStoredToken };
