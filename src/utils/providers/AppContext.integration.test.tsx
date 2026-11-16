// AppContext.integration.test.tsx
// Realtime lifecycle against a fake channel: auth, retries, event handling,
// debounce, reconnect refresh, token refresh, visibility, cleanup, user switch.
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase, deferred, makeNotification, type FakeSupabase } from "./AppContext.fakes";

const h = vi.hoisted(() => ({
  supabase: undefined as unknown,
  user: null as { id: string } | null,
  getToken: vi.fn<() => Promise<string | null>>(),
  playSound: vi.fn<() => void>(),
  unlock: vi.fn<() => Promise<boolean>>(),
  toast: vi.fn<(title: string, options?: unknown) => void>(),
}));

vi.mock("../supabase/client", () => ({ useSupabaseClient: () => h.supabase }));
vi.mock("../media/audio", () => ({
  playNotificationSound: h.playSound,
  unlockNotificationSound: h.unlock,
}));
vi.mock("sonner", () => ({ toast: h.toast }));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: h.user }),
  useAuth: () => ({ getToken: h.getToken }),
}));

type Mod = typeof import("./AppContext");

let mod: Mod;
let fake: FakeSupabase;
let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;

function Wrapper({ children }: { children: ReactNode }) {
  return <mod.AppProvider>{children}</mod.AppProvider>;
}

const flush = (ms = 0) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

async function setup() {
  const view = renderHook(() => mod.useApp(), { wrapper: Wrapper });
  await flush();
  return view;
}

const channel = () => fake.channels.at(-1)!;
const setAuth = () => fake.client.realtime.setAuth;
const cartQueries = () => fake.queriesFor("cart_items", "select").length;
const unreadQueries = () => fake.queriesFor("notifications", "select").length;

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

function insert(overrides: Parameters<typeof makeNotification>[0] = {}) {
  const notification = makeNotification(overrides);
  act(() => channel().emit("notifications", "INSERT", { new: notification }));
  return notification;
}

beforeEach(async () => {
  vi.useFakeTimers();
  fake = createFakeSupabase();
  h.supabase = fake.client;
  h.user = { id: "user_1" };
  h.getToken.mockReset();
  h.getToken.mockResolvedValue("jwt");
  h.unlock.mockReset();
  h.unlock.mockResolvedValue(true);
  h.playSound.mockReset();
  h.toast.mockReset();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  vi.resetModules();
  mod = await import("./AppContext");
});

afterEach(() => {
  cleanup();
  errorSpy.mockRestore();
  warnSpy.mockRestore();
  delete (document as unknown as Record<string, unknown>).visibilityState;
  vi.useRealTimers();
});

describe("subscription setup", () => {
  it("authenticates realtime with the Clerk token before creating the channel", async () => {
    await setup();

    expect(setAuth()).toHaveBeenCalledWith("jwt");
    expect(fake.channels).toHaveLength(1);
    expect(setAuth().mock.invocationCallOrder[0]).toBeLessThan(fake.client.channel.mock.invocationCallOrder[0]);
  });

  it("names the channel per user and listens to exactly the right tables", async () => {
    await setup();

    expect(channel().name).toMatch(/^app_notifications_user_1_\d+$/);
    expect(channel().listeners.map((l) => l.filter)).toEqual([
      { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq.user_1" },
      { event: "UPDATE", schema: "public", table: "notifications", filter: "user_id=eq.user_1" },
      { event: "*", schema: "public", table: "cart_items", filter: "user_id=eq.user_1" },
    ]);
  });

  it("does nothing realtime-related when signed out", async () => {
    h.user = null;

    await setup();
    await flush(60_000);

    expect(setAuth()).not.toHaveBeenCalled();
    expect(fake.client.channel).not.toHaveBeenCalled();
  });
});

describe("realtime auth retries", () => {
  it("retries a missing token every 500ms and succeeds on a later attempt", async () => {
    h.getToken.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await setup();
    expect(fake.channels).toHaveLength(0);

    await flush(1_000);

    expect(h.getToken).toHaveBeenCalledTimes(3);
    expect(fake.channels).toHaveLength(1);
  });

  it("gives up after four attempts and warns instead of subscribing", async () => {
    h.getToken.mockResolvedValue(null);

    await setup();
    await flush(2_000);

    expect(h.getToken).toHaveBeenCalledTimes(4);
    expect(fake.channels).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith("Realtime: no Clerk token available, not subscribing");
  });

  it("logs and retries when setAuth rejects", async () => {
    setAuth().mockRejectedValue(new Error("ws down"));

    await setup();
    await flush(2_000);

    expect(setAuth()).toHaveBeenCalledTimes(4);
    expect(fake.channels).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Realtime auth setup failed"), expect.anything());
  });
});

describe("incoming notifications", () => {
  it("records the notification, bumps the badge, plays a sound and toasts", async () => {
    fake.routes["notifications:select"] = { count: 2, error: null };
    const { result } = await setup();

    const notification = insert();

    expect(result.current.latestNotification).toEqual(notification);
    expect(result.current.unreadCount).toBe(3);
    expect(h.playSound).toHaveBeenCalledTimes(1);
    expect(h.toast).toHaveBeenCalledWith("Order ready", { description: "Your latte is ready" });
  });

  it("still updates state, but stays quiet, when all notifications are muted", async () => {
    fake.routes["notification_settings:select"] = { data: { muted: true, muted_types: [] }, error: null };
    const { result } = await setup();

    insert();

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.latestNotification?.id).toBe("n1");
    expect(h.playSound).not.toHaveBeenCalled();
    expect(h.toast).not.toHaveBeenCalled();
  });

  it("silences only the muted type", async () => {
    fake.routes["notification_settings:select"] = { data: { muted: false, muted_types: ["promo"] }, error: null };
    await setup();

    insert({ id: "a", type: "promo" });
    expect(h.playSound).not.toHaveBeenCalled();

    insert({ id: "b", type: "order" });
    expect(h.playSound).toHaveBeenCalledTimes(1);
    expect(h.toast).toHaveBeenCalledTimes(1);
  });

  it("respects a mute toggled after the subscription was created", async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleNotificationsMuted();
    });
    insert();

    expect(h.playSound).not.toHaveBeenCalled();
  });

  it("re-reads the unread count after an UPDATE event", async () => {
    fake.routes["notifications:select"] = { count: 3, error: null };
    const { result } = await setup();

    fake.routes["notifications:select"] = { count: 1, error: null };
    act(() => channel().emit("notifications", "UPDATE", {}));
    await flush();

    expect(result.current.unreadCount).toBe(1);
  });
});

describe("cart change events", () => {
  it("collapses a burst of changes into one refresh after 250ms", async () => {
    const { result } = await setup();
    const before = cartQueries();
    fake.routes["cart_items:select"] = { data: [{ quantity: 4 }], error: null };

    act(() => {
      channel().emit("cart_items", "INSERT", {});
      channel().emit("cart_items", "UPDATE", {});
      channel().emit("cart_items", "DELETE", {});
    });
    await flush(249);
    expect(cartQueries()).toBe(before);

    await flush(1);

    expect(cartQueries()).toBe(before + 1);
    expect(result.current.cartCount).toBe(4);
  });

  it("restarts the debounce window on every new event", async () => {
    await setup();
    const before = cartQueries();

    act(() => channel().emit("cart_items", "INSERT", {}));
    await flush(200);
    act(() => channel().emit("cart_items", "UPDATE", {}));
    await flush(249);
    expect(cartQueries()).toBe(before);

    await flush(1);
    expect(cartQueries()).toBe(before + 1);
  });
});

describe("channel status", () => {
  it("does not refetch on the first SUBSCRIBED", async () => {
    await setup();
    const [cart, unread] = [cartQueries(), unreadQueries()];

    act(() => channel().status("SUBSCRIBED"));
    await flush();

    expect(cartQueries()).toBe(cart);
    expect(unreadQueries()).toBe(unread);
  });

  it("refetches counts after a reconnect", async () => {
    await setup();
    act(() => channel().status("SUBSCRIBED"));
    const [cart, unread] = [cartQueries(), unreadQueries()];

    act(() => channel().status("CHANNEL_ERROR", { message: "boom" }));
    act(() => channel().status("SUBSCRIBED"));
    await flush();

    expect(cartQueries()).toBe(cart + 1);
    expect(unreadQueries()).toBe(unread + 1);
    expect(warnSpy).toHaveBeenCalledWith("Realtime channel CHANNEL_ERROR:", "boom");
  });

  it("warns with a fallback when the server gives no detail", async () => {
    await setup();

    act(() => channel().status("TIMED_OUT"));

    expect(warnSpy).toHaveBeenCalledWith("Realtime channel TIMED_OUT:", "no detail from server");
  });
});

describe("token refresh and visibility", () => {
  it("re-authenticates realtime every 45 seconds", async () => {
    await setup();
    expect(setAuth()).toHaveBeenCalledTimes(1);

    await flush(45_000);
    expect(setAuth()).toHaveBeenCalledTimes(2);

    await flush(45_000);
    expect(setAuth()).toHaveBeenCalledTimes(3);
  });

  it("ignores the tab being hidden", async () => {
    await setup();
    const [auth, cart, unread] = [setAuth().mock.calls.length, cartQueries(), unreadQueries()];

    setVisibility("hidden");
    await flush();

    expect(setAuth()).toHaveBeenCalledTimes(auth);
    expect(cartQueries()).toBe(cart);
    expect(unreadQueries()).toBe(unread);
  });

  it("re-authenticates and refetches when the tab becomes visible", async () => {
    await setup();
    const [auth, cart, unread] = [setAuth().mock.calls.length, cartQueries(), unreadQueries()];

    setVisibility("visible");
    await flush();

    expect(setAuth()).toHaveBeenCalledTimes(auth + 1);
    expect(cartQueries()).toBe(cart + 1);
    expect(unreadQueries()).toBe(unread + 1);
  });
});

describe("cleanup", () => {
  it("removes the channel and stops every timer and listener on unmount", async () => {
    const view = await setup();
    const created = channel();
    const [auth, cart] = [setAuth().mock.calls.length, cartQueries()];

    act(() => created.emit("cart_items", "INSERT", {})); // leaves a debounce pending
    view.unmount();
    await flush(120_000);
    setVisibility("visible");
    await flush();

    expect(fake.client.removeChannel).toHaveBeenCalledWith(created);
    expect(setAuth()).toHaveBeenCalledTimes(auth);
    expect(cartQueries()).toBe(cart);
  });

  it("never subscribes if unmounted while waiting to retry auth", async () => {
    h.getToken.mockResolvedValue(null);
    const view = await setup();

    view.unmount();
    await flush(5_000);

    expect(h.getToken).toHaveBeenCalledTimes(1);
    expect(fake.channels).toHaveLength(0);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("never subscribes if unmounted while setAuth is still in flight", async () => {
    const pending = deferred<void>();
    setAuth().mockReturnValueOnce(pending.promise);
    const view = await setup();

    view.unmount();
    pending.resolve();
    await flush();

    expect(fake.channels).toHaveLength(0);
  });
});

describe("user switch", () => {
  it("tears down the old channel and subscribes for the new user", async () => {
    const { rerender } = await setup();
    const first = channel();

    h.user = { id: "user_2" };
    rerender();
    await flush();

    expect(fake.client.removeChannel).toHaveBeenCalledWith(first);
    expect(fake.channels).toHaveLength(2);
    expect(channel().name).toMatch(/^app_notifications_user_2_/);
    expect(channel().listeners[0].filter.filter).toBe("user_id=eq.user_2");
  });

  it("KNOWN LIMITATION: latestNotification survives sign-out", async () => {
    // Nothing clears it, so the next account in the same tab starts with the
    // previous user's last notification. Pinned so a fix is a visible change.
    const { result, rerender } = await setup();
    insert({ title: "Private order update" });

    h.user = null;
    rerender();
    await flush();

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.latestNotification?.title).toBe("Private order update");
  });
});