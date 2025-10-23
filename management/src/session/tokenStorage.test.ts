import { describe, expect, it } from "vitest";

import { parseStoredToken, SESSION_STORAGE_KEY } from "./tokenStorage";

describe("parseStoredToken", () => {
  it("returns null when storage is empty", () => {
    expect(parseStoredToken(null)).toBeNull();
  });

  it("returns null when the payload is malformed", () => {
    expect(parseStoredToken("not-json")).toBeNull();
    expect(parseStoredToken(JSON.stringify({}))).toBeNull();
  });

  it("extracts the access token and optional type", () => {
    const token = parseStoredToken(
      JSON.stringify({ accessToken: "abc", tokenType: "Token" }),
    );

    expect(token).toEqual({ accessToken: "abc", tokenType: "Token" });
  });
});

describe("SESSION_STORAGE_KEY", () => {
  it("provides a stable location for session tokens", () => {
    expect(SESSION_STORAGE_KEY).toBe("erm.sessionToken");
  });
});
