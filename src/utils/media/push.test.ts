import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPushSubscriptionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "./push";

const ENDPOINT = "https://push.example.com/send/abc";
const VAPID_KEY = "SGVsbG8";

type SubscriptionJson = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

const GOOD_JSON: SubscriptionJson = {
  endpoint: ENDPOINT,
  keys: { p256dh: "p256dh-key", auth: "auth-secret" },
};

function makeSubscription(json: SubscriptionJson = GOOD_JSON) {
  return {
    endpoint: json.endpoint ?? ENDPOINT,
    toJSON: vi.fn(() => json),
    unsubscribe: vi.fn(() => Promise.resolve(true)),
  };
}

type Subscription = ReturnType<typeof makeSubscription>;

function makeHarness() {
  const subscription = makeSubscription();
  const pushManager = {
    subscribe: vi.fn<(options: PushSubscriptionOptionsInit) => Promise<Subscription>>(
      () => Promise.resolve(subscription),
    ),
    getSubscription: vi.fn<() => Promise<Subscription | null>>(() =>
      Promise.resolve(null),
    ),
  };
  const registration = { pushManager };
  const serviceWorker = {
    getRegistration: vi.fn<(scope?: string) => Promise<typeof registration | undefined>>(
      () => Promise.resolve(registration),
    ),
    register: vi.fn<(path: string) => Promise<typeof registration>>(() =>
      Promise.resolve(registration),
    ),
    ready: Promise.resolve(registration),
  };
  const notification = {
    permission: "default" as NotificationPermission,
    requestPermission: vi.fn<() => Promise<NotificationPermission>>(() =>
      Promise.resolve("granted"),
    ),
  };
  const eq = vi.fn<(column: string, value: string) => Promise<{ error: unknown }>>(
    () => Promise.resolve({ error: null }),
  );
  const del = vi.fn(() => ({ eq }));
  const from = vi.fn((_table: string) => ({ delete: del }));
  const rpc = vi.fn<(fn: string, args: Record<string, string>) => Promise<{ error: unknown }>>(
    () => Promise.resolve({ error: null }),
  );
  const supabase = { rpc, from } as unknown as SupabaseClient;

  return {
    subscription,
    pushManager,
    registration,
    serviceWorker,
    notification,
    eq,
    del,
    from,
    rpc,
    supabase,
  };
}

type Harness = ReturnType<typeof makeHarness>;

function installBrowser(h: Harness) {
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("navigator", { serviceWorker: h.serviceWorker });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", h.notification);
}

let h: Harness;
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  h = makeHarness();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", VAPID_KEY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

describe("isPushSupported", () => {
  it("is true when service workers, PushManager and Notification all exist", () => {
    installBrowser(h);
    expect(isPushSupported()).toBe(true);
  });

  it("is false on the server", () => {
    installBrowser(h);
    vi.stubGlobal("window", undefined);
    expect(isPushSupported()).toBe(false);
  });

  it("is false without service worker support", () => {
    installBrowser(h);
    vi.stubGlobal("navigator", {});
    expect(isPushSupported()).toBe(false);
  });

  it("is false without PushManager", () => {
    installBrowser(h);
    Reflect.deleteProperty(globalThis, "PushManager");
    expect(isPushSupported()).toBe(false);
  });

  it("is false without the Notification API", () => {
    installBrowser(h);
    Reflect.deleteProperty(globalThis, "Notification");
    expect(isPushSupported()).toBe(false);
  });
});

describe("getPushSubscriptionState", () => {
  beforeEach(() => installBrowser(h));

  it("returns unsupported when push is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    await expect(getPushSubscriptionState()).resolves.toBe("unsupported");
  });

  it("returns denied without touching the service worker", async () => {
    h.notification.permission = "denied";

    await expect(getPushSubscriptionState()).resolves.toBe("denied");
    expect(h.serviceWorker.getRegistration).not.toHaveBeenCalled();
  });

  it("returns unsubscribed when no registration exists", async () => {
    h.serviceWorker.getRegistration.mockResolvedValue(undefined);

    await expect(getPushSubscriptionState()).resolves.toBe("unsubscribed");
    expect(h.serviceWorker.getRegistration).toHaveBeenCalledWith();
  });

  it("returns unsubscribed when registered but not subscribed", async () => {
    h.pushManager.getSubscription.mockResolvedValue(null);
    await expect(getPushSubscriptionState()).resolves.toBe("unsubscribed");
  });

  it("returns subscribed when an existing subscription is found", async () => {
    h.pushManager.getSubscription.mockResolvedValue(h.subscription);
    await expect(getPushSubscriptionState()).resolves.toBe("subscribed");
  });

  it("treats permission 'default' like any other non-denied state", async () => {
    h.notification.permission = "default";
    h.pushManager.getSubscription.mockResolvedValue(h.subscription);
    await expect(getPushSubscriptionState()).resolves.toBe("subscribed");
  });

  it("logs and returns unsubscribed when getRegistration rejects", async () => {
    const failure = new Error("sw broke");
    h.serviceWorker.getRegistration.mockRejectedValue(failure);

    await expect(getPushSubscriptionState()).resolves.toBe("unsubscribed");
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to read push subscription state:",
      failure,
    );
  });

  it("logs and returns unsubscribed when getSubscription rejects", async () => {
    const failure = new Error("pm broke");
    h.pushManager.getSubscription.mockRejectedValue(failure);

    await expect(getPushSubscriptionState()).resolves.toBe("unsubscribed");
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to read push subscription state:",
      failure,
    );
  });
});

describe("subscribeToPush - preconditions", () => {
  beforeEach(() => installBrowser(h));

  it("warns and returns false when push is unsupported", async () => {
    vi.stubGlobal("navigator", {});

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);
    expect(consoleWarn).toHaveBeenCalledWith(
      "Push notifications aren't supported in this browser.",
    );
    expect(h.notification.requestPermission).not.toHaveBeenCalled();
  });

  it.each([
    ["undefined", undefined],
    ["an empty string", ""],
  ])("returns false when userId is %s", async (_label, userId) => {
    await expect(subscribeToPush(h.supabase, userId)).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "subscribeToPush: userId is required to persist a subscription.",
    );
    expect(h.notification.requestPermission).not.toHaveBeenCalled();
  });

  it("returns false and logs when the VAPID key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "");

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.",
    );
    expect(h.notification.requestPermission).not.toHaveBeenCalled();
  });

  it("returns false and logs when requesting permission throws", async () => {
    const failure = new Error("prompt blocked");
    h.notification.requestPermission.mockRejectedValue(failure);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to request notification permission:",
      failure,
    );
    expect(h.serviceWorker.getRegistration).not.toHaveBeenCalled();
  });

  it.each<NotificationPermission>(["denied", "default"])(
    "returns false without subscribing when permission is %s",
    async (permission) => {
      h.notification.requestPermission.mockResolvedValue(permission);

      await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

      expect(h.serviceWorker.getRegistration).not.toHaveBeenCalled();
      expect(h.pushManager.subscribe).not.toHaveBeenCalled();
      expect(h.rpc).not.toHaveBeenCalled();
    },
  );
});

describe("subscribeToPush - service worker and subscription", () => {
  beforeEach(() => installBrowser(h));

  it("reuses an existing registration without registering again", async () => {
    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(true);

    expect(h.serviceWorker.getRegistration).toHaveBeenCalledWith("/sw.js");
    expect(h.serviceWorker.register).not.toHaveBeenCalled();
  });

  it("registers /sw.js when no registration exists", async () => {
    h.serviceWorker.getRegistration.mockResolvedValueOnce(undefined);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(true);

    expect(h.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(h.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
    expect(h.pushManager.subscribe).toHaveBeenCalledTimes(1);
  });

  it("requests permission before touching the service worker", async () => {
    await subscribeToPush(h.supabase, "user-1");

    const permissionOrder =
      h.notification.requestPermission.mock.invocationCallOrder[0];
    const registrationOrder =
      h.serviceWorker.getRegistration.mock.invocationCallOrder[0];
    expect(permissionOrder).toBeLessThan(registrationOrder);
  });

  it("subscribes as user-visible", async () => {
    await subscribeToPush(h.supabase, "user-1");

    expect(h.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    );
  });

  it.each<[string, number[]]>([
    ["SGVsbG8", [72, 101, 108, 108, 111]],
    ["SGk", [72, 105]],
    ["SA", [72]],
    ["-__-", [251, 255, 254]],
  ])(
    "decodes the url-safe base64 VAPID key %s into the right bytes",
    async (key, bytes) => {
      vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", key);

      await subscribeToPush(h.supabase, "user-1");

      const { applicationServerKey } = h.pushManager.subscribe.mock.calls[0][0];
      expect(Array.from(applicationServerKey as Uint8Array)).toEqual(bytes);
    },
  );

  it("returns false and logs when the VAPID key cannot be decoded", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "***");

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to register service worker or create push subscription:",
      expect.anything(),
    );
    expect(h.pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("returns false and logs when registering the service worker fails", async () => {
    const failure = new Error("register failed");
    h.serviceWorker.getRegistration.mockResolvedValueOnce(undefined);
    h.serviceWorker.register.mockRejectedValue(failure);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to register service worker or create push subscription:",
      failure,
    );
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("replaces a stale subscription after an InvalidStateError and retries once", async () => {
    const stale = makeSubscription();
    h.pushManager.subscribe.mockRejectedValueOnce(
      new DOMException("different key", "InvalidStateError"),
    );
    h.pushManager.getSubscription.mockResolvedValueOnce(stale);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(true);

    expect(stale.unsubscribe).toHaveBeenCalledTimes(1);
    expect(h.pushManager.subscribe).toHaveBeenCalledTimes(2);
    expect(h.pushManager.subscribe.mock.calls[1][0]).toEqual(
      h.pushManager.subscribe.mock.calls[0][0],
    );
    expect(stale.unsubscribe.mock.invocationCallOrder[0]).toBeLessThan(
      h.pushManager.subscribe.mock.invocationCallOrder[1],
    );
    expect(h.rpc).toHaveBeenCalledTimes(1);
  });

  it("rethrows an InvalidStateError when there is no stale subscription to clear", async () => {
    const failure = new DOMException("different key", "InvalidStateError");
    h.pushManager.subscribe.mockRejectedValue(failure);
    h.pushManager.getSubscription.mockResolvedValue(null);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(h.pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to register service worker or create push subscription:",
      failure,
    );
  });

  it("returns false when the retry after clearing a stale subscription also fails", async () => {
    const stale = makeSubscription();
    const retryFailure = new Error("still broken");
    h.pushManager.subscribe
      .mockRejectedValueOnce(new DOMException("x", "InvalidStateError"))
      .mockRejectedValueOnce(retryFailure);
    h.pushManager.getSubscription.mockResolvedValueOnce(stale);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to register service worker or create push subscription:",
      retryFailure,
    );
  });

  it.each([
    ["a DOMException with another name", new DOMException("no", "NotAllowedError")],
    ["a plain Error", new Error("boom")],
  ])("does not try to recover from %s", async (_label, failure) => {
    h.pushManager.subscribe.mockRejectedValue(failure);

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(h.pushManager.getSubscription).not.toHaveBeenCalled();
    expect(h.pushManager.subscribe).toHaveBeenCalledTimes(1);
  });
});

describe("subscribeToPush - persisting the subscription", () => {
  beforeEach(() => installBrowser(h));

  it.each<[string, SubscriptionJson]>([
    ["endpoint is missing", { keys: GOOD_JSON.keys }],
    ["keys are missing", { endpoint: ENDPOINT }],
    ["p256dh is missing", { endpoint: ENDPOINT, keys: { auth: "auth-secret" } }],
    ["auth is missing", { endpoint: ENDPOINT, keys: { p256dh: "p256dh-key" } }],
    ["endpoint is empty", { endpoint: "", keys: GOOD_JSON.keys }],
  ])("returns false and skips the RPC when %s", async (_label, json) => {
    h.pushManager.subscribe.mockResolvedValue(makeSubscription(json));

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(consoleError).toHaveBeenCalledWith(
      "Push subscription is missing required fields.",
    );
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("claims the subscription through the RPC and returns true", async () => {
    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(true);

    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(h.rpc).toHaveBeenCalledWith("claim_push_subscription", {
      p_endpoint: ENDPOINT,
      p_p256dh: "p256dh-key",
      p_auth: "auth-secret",
    });
  });

  it.each([
    ["a non-retryable code", { code: "23505", message: "duplicate key" }],
    ["a non-string code", { code: 42501, message: undefined }],
    ["an unrelated message", { message: "boom" }],
    ["an empty error object", {}],
  ])("does not retry %s", async (_label, failure) => {
    h.rpc.mockResolvedValue({ error: failure });

    await expect(subscribeToPush(h.supabase, "user-1")).resolves.toBe(false);

    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to save push subscription:",
      failure,
    );
  });
});

describe("subscribeToPush - RPC retries", () => {
  beforeEach(() => {
    installBrowser(h);
    vi.useFakeTimers();
  });

  it.each([
    ["PGRST303", { code: "PGRST303", message: "JWT expired" }],
    ["42501", { code: "42501", message: "permission denied" }],
    ["an 'authentication required' message", { message: "Authentication Required" }],
  ])("retries after 400ms on %s and succeeds", async (_label, failure) => {
    h.rpc
      .mockResolvedValueOnce({ error: failure })
      .mockResolvedValueOnce({ error: null });

    const promise = subscribeToPush(h.supabase, "user-1");

    await vi.advanceTimersByTimeAsync(399);
    expect(h.rpc).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(h.rpc).toHaveBeenCalledTimes(2);

    await expect(promise).resolves.toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("backs off linearly (400ms, then 800ms) and gives up after three attempts", async () => {
    const failure = { code: "PGRST303", message: "JWT expired" };
    h.rpc.mockResolvedValue({ error: failure });

    const promise = subscribeToPush(h.supabase, "user-1");

    await vi.advanceTimersByTimeAsync(399);
    expect(h.rpc).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.rpc).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(799);
    expect(h.rpc).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.rpc).toHaveBeenCalledTimes(3);

    await expect(promise).resolves.toBe(false);
    expect(h.rpc).toHaveBeenCalledTimes(3);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to save push subscription:",
      failure,
    );
  });

  it("stops retrying as soon as a non-retryable error appears", async () => {
    const fatal = { code: "23505", message: "duplicate key" };
    h.rpc
      .mockResolvedValueOnce({ error: { code: "PGRST303" } })
      .mockResolvedValueOnce({ error: fatal });

    const promise = subscribeToPush(h.supabase, "user-1");
    await vi.advanceTimersByTimeAsync(400);

    await expect(promise).resolves.toBe(false);
    expect(h.rpc).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to save push subscription:",
      fatal,
    );
  });

  it("succeeds on the final attempt", async () => {
    h.rpc
      .mockResolvedValueOnce({ error: { code: "PGRST303" } })
      .mockResolvedValueOnce({ error: { code: "PGRST303" } })
      .mockResolvedValueOnce({ error: null });

    const promise = subscribeToPush(h.supabase, "user-1");
    await vi.advanceTimersByTimeAsync(400);
    await vi.advanceTimersByTimeAsync(800);

    await expect(promise).resolves.toBe(true);
    expect(h.rpc).toHaveBeenCalledTimes(3);
  });
});

describe("unsubscribeFromPush", () => {
  beforeEach(() => installBrowser(h));

  it("does nothing when push is unsupported", async () => {
    vi.stubGlobal("navigator", {});

    await expect(unsubscribeFromPush(h.supabase)).resolves.toBeUndefined();
    expect(h.from).not.toHaveBeenCalled();
  });

  it("does nothing when there is no registration", async () => {
    h.serviceWorker.getRegistration.mockResolvedValue(undefined);

    await unsubscribeFromPush(h.supabase);

    expect(h.from).not.toHaveBeenCalled();
  });

  it("does nothing when there is no active subscription", async () => {
    h.pushManager.getSubscription.mockResolvedValue(null);

    await unsubscribeFromPush(h.supabase);

    expect(h.from).not.toHaveBeenCalled();
    expect(h.subscription.unsubscribe).not.toHaveBeenCalled();
  });

  it("deletes the row by endpoint, then unsubscribes the browser", async () => {
    h.pushManager.getSubscription.mockResolvedValue(h.subscription);

    await unsubscribeFromPush(h.supabase);

    expect(h.from).toHaveBeenCalledWith("push_subscriptions");
    expect(h.del).toHaveBeenCalledTimes(1);
    expect(h.eq).toHaveBeenCalledWith("endpoint", ENDPOINT);
    expect(h.subscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(h.eq.mock.invocationCallOrder[0]).toBeLessThan(
      h.subscription.unsubscribe.mock.invocationCallOrder[0],
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("logs a database error but still unsubscribes the browser", async () => {
    const failure = { message: "rls denied", code: "42501" };
    h.pushManager.getSubscription.mockResolvedValue(h.subscription);
    h.eq.mockResolvedValue({ error: failure });

    await unsubscribeFromPush(h.supabase);

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to remove push subscription from database:",
      failure,
    );
    expect(h.subscription.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("logs and resolves when getRegistration rejects", async () => {
    const failure = new Error("sw gone");
    h.serviceWorker.getRegistration.mockRejectedValue(failure);

    await expect(unsubscribeFromPush(h.supabase)).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to unsubscribe from push:",
      failure,
    );
  });

  it("logs and resolves when the browser unsubscribe rejects", async () => {
    const failure = new Error("unsubscribe failed");
    h.subscription.unsubscribe.mockRejectedValue(failure);
    h.pushManager.getSubscription.mockResolvedValue(h.subscription);

    await expect(unsubscribeFromPush(h.supabase)).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to unsubscribe from push:",
      failure,
    );
  });

  it("logs and resolves when the database call itself throws", async () => {
    const failure = new Error("network down");
    h.pushManager.getSubscription.mockResolvedValue(h.subscription);
    h.eq.mockRejectedValue(failure);

    await expect(unsubscribeFromPush(h.supabase)).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to unsubscribe from push:",
      failure,
    );
    expect(h.subscription.unsubscribe).not.toHaveBeenCalled();
  });
});