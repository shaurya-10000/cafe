// src/lib/supabase/client.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useSupabaseClient } from "./client";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: mocks.useAuth,
}));

type GetToken = (options?: unknown) => Promise<string | null>;
type AccessToken = () => Promise<string | null>;

const SUPABASE_URL = "https://example.supabase.co";
const SUPABASE_ANON_KEY = "anon-key";

function makeGetToken(token: string | null | undefined = "token-a") {
  return vi.fn<GetToken>(async () => token as string | null);
}

function useAuthReturns(getToken: GetToken) {
  mocks.useAuth.mockReturnValue({ getToken });
}

/** Pulls the `accessToken` callback the hook handed to `createClient`. */
function capturedAccessToken(callIndex = -1): AccessToken {
  const call = mocks.createClient.mock.calls.at(callIndex);
  if (!call) throw new Error("createClient was not called");
  const options = call[2] as { accessToken: AccessToken };
  return options.accessToken;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useSupabaseClient", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let clientSeq = 0;

  beforeEach(() => {
    // `isolate: false` + `mockReset: false`: implementations survive between
    // tests (and files), so we re-establish every one we depend on here.
    clientSeq = 0;
    mocks.createClient.mockImplementation(() => ({ __client: ++clientSeq }));

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", SUPABASE_ANON_KEY);

    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // `restoreMocks` is false in this project, so spies on globals would leak
    // into other files sharing this worker unless we restore explicitly.
    warnSpy.mockRestore();
    mocks.useAuth.mockReset();
  });

  describe("client construction", () => {
    it("creates the client with the public URL and anon key", () => {
      useAuthReturns(makeGetToken());

      renderHook(() => useSupabaseClient());

      expect(mocks.createClient).toHaveBeenCalledTimes(1);
      const [url, key] = mocks.createClient.mock.calls[0];
      expect(url).toBe(SUPABASE_URL);
      expect(key).toBe(SUPABASE_ANON_KEY);
    });

    it("authenticates through an `accessToken` callback, not static headers", () => {
      useAuthReturns(makeGetToken());

      renderHook(() => useSupabaseClient());

      const options = mocks.createClient.mock.calls[0][2];
      expect(options.accessToken).toBeTypeOf("function");
      expect(options.global?.headers?.Authorization).toBeUndefined();
    });

    it("returns whatever createClient returned", () => {
      useAuthReturns(makeGetToken());

      const { result } = renderHook(() => useSupabaseClient());

      expect(result.current).toEqual({ __client: 1 });
    });
  });

  describe("client identity stability", () => {
    it("returns the same client across plain re-renders", () => {
      useAuthReturns(makeGetToken());

      const { result, rerender } = renderHook(() => useSupabaseClient());
      const first = result.current;

      rerender();
      rerender();

      expect(result.current).toBe(first);
      expect(mocks.createClient).toHaveBeenCalledTimes(1);
    });

    it("does not recreate the client when Clerk's getToken identity changes", () => {
      useAuthReturns(makeGetToken("a"));

      const { result, rerender } = renderHook(() => useSupabaseClient());
      const first = result.current;

      useAuthReturns(makeGetToken("b"));
      rerender();

      useAuthReturns(makeGetToken("c"));
      rerender();

      expect(result.current).toBe(first);
      expect(mocks.createClient).toHaveBeenCalledTimes(1);
    });

    it("keeps the same accessToken callback for the lifetime of the client", () => {
      useAuthReturns(makeGetToken("a"));
      const { rerender } = renderHook(() => useSupabaseClient());
      const before = capturedAccessToken();

      useAuthReturns(makeGetToken("b"));
      rerender();

      expect(mocks.createClient).toHaveBeenCalledTimes(1);
      expect(capturedAccessToken()).toBe(before);
    });

    it("creates separate clients for separate hook instances", () => {
      useAuthReturns(makeGetToken());

      const one = renderHook(() => useSupabaseClient());
      const two = renderHook(() => useSupabaseClient());

      expect(one.result.current).not.toBe(two.result.current);
      expect(mocks.createClient).toHaveBeenCalledTimes(2);
    });
  });

  describe("token bridge", () => {
    it("serves the very first request from the seeded getToken", async () => {
      const getToken = makeGetToken("seeded");
      useAuthReturns(getToken);

      renderHook(() => useSupabaseClient());

      await expect(capturedAccessToken()()).resolves.toBe("seeded");
      expect(getToken).toHaveBeenCalledTimes(1);
    });

    it("routes subsequent requests to the latest getToken", async () => {
      const first = makeGetToken("first");
      const second = makeGetToken("second");

      useAuthReturns(first);
      const { rerender } = renderHook(() => useSupabaseClient());

      useAuthReturns(second);
      rerender();

      await expect(capturedAccessToken()()).resolves.toBe("second");
      expect(second).toHaveBeenCalledTimes(1);
      expect(first).not.toHaveBeenCalled();
    });

    it("follows getToken swaps in both directions (A → B → A)", async () => {
      const a = makeGetToken("a");
      const b = makeGetToken("b");

      useAuthReturns(a);
      const { rerender } = renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      await expect(accessToken()).resolves.toBe("a");

      useAuthReturns(b);
      rerender();
      await expect(accessToken()).resolves.toBe("b");

      useAuthReturns(a);
      rerender();
      await expect(accessToken()).resolves.toBe("a");

      expect(a).toHaveBeenCalledTimes(2);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it("lets an in-flight request finish on its original getToken while new requests use the new one", async () => {
      const slow = deferred<string | null>();
      const oldGetToken = vi.fn<GetToken>(() => slow.promise);
      const newGetToken = makeGetToken("fresh");

      useAuthReturns(oldGetToken);
      const { rerender } = renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      const inFlight = accessToken();

      useAuthReturns(newGetToken);
      rerender();

      await expect(accessToken()).resolves.toBe("fresh");

      slow.resolve("stale-but-valid-for-that-request");
      await expect(inFlight).resolves.toBe("stale-but-valid-for-that-request");

      expect(oldGetToken).toHaveBeenCalledTimes(1);
      expect(newGetToken).toHaveBeenCalledTimes(1);
    });

    it("asks Clerk for a token on every request instead of caching one", async () => {
      const getToken = vi
        .fn<GetToken>()
        .mockResolvedValueOnce("t1")
        .mockResolvedValueOnce("t2")
        .mockResolvedValueOnce("t3");
      useAuthReturns(getToken);

      renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      await expect(accessToken()).resolves.toBe("t1");
      await expect(accessToken()).resolves.toBe("t2");
      await expect(accessToken()).resolves.toBe("t3");
      expect(getToken).toHaveBeenCalledTimes(3);
    });

    it("handles concurrent requests independently", async () => {
      const getToken = vi
        .fn<GetToken>()
        .mockResolvedValueOnce("t1")
        .mockResolvedValueOnce("t2");
      useAuthReturns(getToken);

      renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      const results = await Promise.all([accessToken(), accessToken()]);

      expect(results).toEqual(["t1", "t2"]);
    });
  });

  describe("signed-out and failure behaviour (falls back to anon)", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
    ])("normalizes a %s token to null", async (_label, value) => {
      // Not via makeGetToken: its default parameter would swallow `undefined`.
      useAuthReturns(vi.fn<GetToken>().mockResolvedValue(value as string | null));

      renderHook(() => useSupabaseClient());

      await expect(capturedAccessToken()()).resolves.toBeNull();
    });

    it("does not coerce an empty-string token into null-vs-anon surprises", async () => {
      // `??` only normalizes null/undefined; an empty string is passed through
      // as-is. Pin this so a switch to `||` is a deliberate decision.
      useAuthReturns(makeGetToken(""));

      renderHook(() => useSupabaseClient());

      await expect(capturedAccessToken()()).resolves.toBe("");
    });

    it("resolves to null (never rejects) when getToken rejects", async () => {
      const failure = new Error("network down");
      useAuthReturns(vi.fn<GetToken>().mockRejectedValue(failure));

      renderHook(() => useSupabaseClient());

      await expect(capturedAccessToken()()).resolves.toBeNull();
    });

    it("resolves to null when getToken throws synchronously", async () => {
      useAuthReturns(
        vi.fn<GetToken>(() => {
          throw new Error("sync boom");
        }),
      );

      renderHook(() => useSupabaseClient());

      await expect(capturedAccessToken()()).resolves.toBeNull();
    });

    it("resolves to null for non-Error rejection values", async () => {
      useAuthReturns(vi.fn<GetToken>().mockRejectedValue("string failure"));

      renderHook(() => useSupabaseClient());

      await expect(capturedAccessToken()()).resolves.toBeNull();
    });

    it("recovers on the next request after a transient failure", async () => {
      const getToken = vi
        .fn<GetToken>()
        .mockRejectedValueOnce(new Error("transient"))
        .mockResolvedValueOnce("recovered");
      useAuthReturns(getToken);

      renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      await expect(accessToken()).resolves.toBeNull();
      await expect(accessToken()).resolves.toBe("recovered");
    });
  });

  describe("failure logging", () => {
    it("warns with a prefixed message and the original error outside production", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const failure = new Error("clerk unavailable");
      useAuthReturns(vi.fn<GetToken>().mockRejectedValue(failure));

      renderHook(() => useSupabaseClient());
      await capturedAccessToken()();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const [message, err] = warnSpy.mock.calls[0];
      expect(message).toContain("[supabase/client]");
      expect(message).toContain("falling back to anon");
      expect(err).toBe(failure);
    });

    it("stays silent in production so tokens/errors never reach prod consoles", async () => {
      vi.stubEnv("NODE_ENV", "production");
      useAuthReturns(vi.fn<GetToken>().mockRejectedValue(new Error("nope")));

      renderHook(() => useSupabaseClient());
      await expect(capturedAccessToken()()).resolves.toBeNull();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("does not warn on the happy path or for a signed-out (null) token", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const getToken = vi
        .fn<GetToken>()
        .mockResolvedValueOnce("ok")
        .mockResolvedValueOnce(null);
      useAuthReturns(getToken);

      renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      await accessToken();
      await accessToken();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("server-side guard", () => {
    it("returns null without touching Clerk when `window` is undefined", async () => {
      const getToken = makeGetToken("should-not-be-used");
      useAuthReturns(getToken);

      renderHook(() => useSupabaseClient());
      const accessToken = capturedAccessToken();

      // Stub after render: the hook itself needs a DOM, but a client created
      // in the browser and invoked in a window-less context must not hit Clerk.
      vi.stubGlobal("window", undefined);
      try {
        await expect(accessToken()).resolves.toBeNull();
        expect(getToken).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        // Must happen before RTL's afterEach cleanup, which needs `window` to unmount.
        vi.unstubAllGlobals();
      }
    });
  });
});