// src/utils/supabase/server.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "./server";

const mocks = vi.hoisted(() => ({
  createSupabaseClient: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createSupabaseClient,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

type GetToken = (options?: unknown) => Promise<string | null>;
type AccessToken = () => Promise<string | null>;

const SUPABASE_URL = "https://example.supabase.co";
const SUPABASE_ANON_KEY = "anon-key";

function authReturns(getToken: GetToken) {
  mocks.auth.mockResolvedValue({ getToken });
}

/** Pulls the `accessToken` callback handed to the Supabase client factory. */
function capturedAccessToken(callIndex = -1): AccessToken {
  const call = mocks.createSupabaseClient.mock.calls.at(callIndex);
  if (!call) throw new Error("createClient (supabase-js) was not called");
  return (call[2] as { accessToken: AccessToken }).accessToken;
}

describe("server createClient", () => {
  let clientSeq = 0;

  beforeEach(() => {
    // `isolate: false` + `mockReset: false`: implementations survive between
    // tests and files, so re-establish everything this suite depends on.
    clientSeq = 0;
    mocks.createSupabaseClient.mockImplementation(() => ({
      __client: ++clientSeq,
    }));
    mocks.auth.mockReset();

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY);
  });

  describe("client construction", () => {
    it("creates the client with the public URL and anon key", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("t"));

      await createClient();

      expect(mocks.createSupabaseClient).toHaveBeenCalledTimes(1);
      const [url, key] = mocks.createSupabaseClient.mock.calls[0];
      expect(url).toBe(SUPABASE_URL);
      expect(key).toBe(SUPABASE_ANON_KEY);
    });

    it("authenticates through an `accessToken` callback, not static headers", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("t"));

      await createClient();

      const options = mocks.createSupabaseClient.mock.calls[0][2];
      expect(options.accessToken).toBeTypeOf("function");
      expect(options.global?.headers?.Authorization).toBeUndefined();
    });

    it("returns whatever the Supabase factory returned", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("t"));

      await expect(createClient()).resolves.toEqual({ __client: 1 });
    });

    it("reads env vars at call time, not import time", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("t"));

      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://other.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "other-key");
      await createClient();

      const [url, key] = mocks.createSupabaseClient.mock.calls[0];
      expect(url).toBe("https://other.supabase.co");
      expect(key).toBe("other-key");
    });
  });

  describe("request scoping", () => {
    it("resolves Clerk auth() exactly once per createClient call", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("t"));

      await createClient();

      expect(mocks.auth).toHaveBeenCalledTimes(1);
    });

    it("does not fetch a token eagerly at client creation", async () => {
      const getToken = vi.fn<GetToken>().mockResolvedValue("t");
      authReturns(getToken);

      await createClient();

      expect(getToken).not.toHaveBeenCalled();
    });

    it("never shares clients between calls (no module-level caching)", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("t"));

      const a = await createClient();
      const b = await createClient();

      expect(a).not.toBe(b);
      expect(mocks.createSupabaseClient).toHaveBeenCalledTimes(2);
    });

    it("binds each client to the auth context of its own request", async () => {
      // Guards against cross-request token leakage on the server: a client
      // built for user A must never resolve user B's token.
      const userA = vi.fn<GetToken>().mockResolvedValue("token-user-a");
      const userB = vi.fn<GetToken>().mockResolvedValue("token-user-b");

      authReturns(userA);
      await createClient();
      const tokenForA = capturedAccessToken();

      authReturns(userB);
      await createClient();
      const tokenForB = capturedAccessToken();

      await expect(tokenForA()).resolves.toBe("token-user-a");
      await expect(tokenForB()).resolves.toBe("token-user-b");
      expect(userA).toHaveBeenCalledTimes(1);
      expect(userB).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessToken callback", () => {
    it("returns the token from Clerk", async () => {
      authReturns(vi.fn<GetToken>().mockResolvedValue("jwt-123"));

      await createClient();

      await expect(capturedAccessToken()()).resolves.toBe("jwt-123");
    });

    it("calls getToken with no arguments (default session token)", async () => {
      const getToken = vi.fn<GetToken>().mockResolvedValue("t");
      authReturns(getToken);

      await createClient();
      await capturedAccessToken()();

      expect(getToken).toHaveBeenCalledTimes(1);
      expect(getToken).toHaveBeenCalledWith();
    });

    it("asks Clerk on every request instead of caching a token", async () => {
      const getToken = vi
        .fn<GetToken>()
        .mockResolvedValueOnce("t1")
        .mockResolvedValueOnce("t2")
        .mockResolvedValueOnce("t3");
      authReturns(getToken);

      await createClient();
      const accessToken = capturedAccessToken();

      await expect(accessToken()).resolves.toBe("t1");
      await expect(accessToken()).resolves.toBe("t2");
      await expect(accessToken()).resolves.toBe("t3");
      expect(getToken).toHaveBeenCalledTimes(3);
    });

    it("handles concurrent calls independently", async () => {
      const getToken = vi
        .fn<GetToken>()
        .mockResolvedValueOnce("t1")
        .mockResolvedValueOnce("t2");
      authReturns(getToken);

      await createClient();
      const accessToken = capturedAccessToken();

      await expect(Promise.all([accessToken(), accessToken()])).resolves.toEqual(
        ["t1", "t2"],
      );
    });
  });

  describe("signed-out behaviour (falls back to anon)", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
    ])("normalizes a %s token to null", async (_label, value) => {
      // Not via a helper with a default parameter: it would swallow `undefined`.
      authReturns(vi.fn<GetToken>().mockResolvedValue(value as string | null));

      await createClient();

      await expect(capturedAccessToken()()).resolves.toBeNull();
    });

    it("passes an empty-string token through unchanged", async () => {
      // `??` only normalizes null/undefined. Pin this so a switch to `||`
      // is a deliberate decision.
      authReturns(vi.fn<GetToken>().mockResolvedValue(""));

      await createClient();

      await expect(capturedAccessToken()()).resolves.toBe("");
    });
  });

  describe("failure propagation (no swallowing, unlike the browser hook)", () => {
    it("propagates a getToken rejection to the caller", async () => {
      // The browser hook degrades to anon on failure; the server client
      // deliberately does not. Pin it so any change is intentional.
      const failure = new Error("clerk unavailable");
      authReturns(vi.fn<GetToken>().mockRejectedValue(failure));

      await createClient();

      await expect(capturedAccessToken()()).rejects.toBe(failure);
    });

    it("propagates a synchronous getToken throw as a rejection", async () => {
      authReturns(
        vi.fn<GetToken>(() => {
          throw new Error("sync boom");
        }),
      );

      await createClient();

      await expect(capturedAccessToken()()).rejects.toThrow("sync boom");
    });

    it("recovers on the next call after a transient failure", async () => {
      const getToken = vi
        .fn<GetToken>()
        .mockRejectedValueOnce(new Error("transient"))
        .mockResolvedValueOnce("recovered");
      authReturns(getToken);

      await createClient();
      const accessToken = capturedAccessToken();

      await expect(accessToken()).rejects.toThrow("transient");
      await expect(accessToken()).resolves.toBe("recovered");
    });

    it("rejects without building a client when Clerk auth() fails", async () => {
      const failure = new Error("auth() outside request scope");
      mocks.auth.mockRejectedValue(failure);

      await expect(createClient()).rejects.toBe(failure);
      expect(mocks.createSupabaseClient).not.toHaveBeenCalled();
    });
  });
});