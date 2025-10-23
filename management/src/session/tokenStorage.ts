export const SESSION_STORAGE_KEY = "erm.sessionToken";

export interface SessionToken {
  accessToken: string;
  tokenType?: string;
}

export interface SessionTokenStorage {
  getSessionToken(): SessionToken | null;
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

export const browserSessionTokenStorage: SessionTokenStorage = {
  getSessionToken(): SessionToken | null {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return null;
    }

    try {
      const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      return parseStoredToken(stored);
    } catch {
      return null;
    }
  },
};

export { parseStoredToken };
