import { describe, expect, it, vi } from "vitest";

import { createOidcClient } from "../oidcClient";

const config = {
  clientId: "client-id",
  authorizationEndpoint: "https://auth.example/authorize",
  tokenEndpoint: "https://auth.example/token",
  redirectUri: "https://app.example/callback",
  scope: "openid profile",
  issuer: "https://issuer.example/",
};

describe("createOidcClient", () => {
  it("rejects exchanges when the response omits the expected state", async () => {
    const storageData = new Map<string, string>();
    const storage = {
      getItem: (key: string) => storageData.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storageData.set(key, value);
      },
      removeItem: (key: string) => {
        storageData.delete(key);
      },
    } satisfies Pick<Storage, "getItem" | "setItem" | "removeItem">;

    storage.setItem(
      "erm.oidc.pendingAuth",
      JSON.stringify({ codeVerifier: "verifier", state: "expected-state" }),
    );

    const fetchImplementation = vi.fn();
    const client = createOidcClient(config, { storage, fetchImplementation });

    await expect(client.exchangeCodeForToken({ code: "auth-code" })).rejects.toThrow(
      "The authorization response did not include the expected state parameter.",
    );

    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
