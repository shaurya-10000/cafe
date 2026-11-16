// AppContext.test.ts
// Data layer: loading, retry, error logging, optimistic updates and rollback,
// all driven through renderHook with a fake Supabase. Realtime lives in the
// integration suite; rendering and DOM events live in the component suite.
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFakeSupabase,
  deferred,
  type FakeSupabase,
  type QueryResult,
} from "./AppContext.fakes";

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

function wrapper({ children }: { children: ReactNode }) {
  return createElement(mod.AppProvider, null, children);
}

/** Advances fake time and drains pending promises inside act(). */
const flush = (ms = 0) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

async function setup() {
  const view = renderHook(() => mod.useApp(), { wrapper });
  await flush();
  return view;
}

const cartQueries = () => fake.queriesFor("cart_items", "select").length;

beforeEach(async () => {
  // `isolate: false` + `mockReset: false`: re-establish everything per test.
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
  cleanup(); // unmount while fake timers are still installed
  errorSpy.mockRestore();
  warnSpy.mockRestore();
  vi.useRealTimers();
});

describe("module contract", () => {
  it("exports the provider and the hook", () => {
    expect(mod.AppProvider).toBeTypeOf("function");
    expect(mod.useApp).toBeTypeOf("function");
  });

  it("throws a helpful error when useApp is used outside <AppProvider>", () => {
    expect(() => renderHook(() => mod.useApp())).toThrow("useApp must be used within AppProvider");
  });

  it("exposes the full context surface", async () => {
    const { result } = await setup();
    const fns = [
      "setCartCount",
      "refreshCounts",
      "markAllNotificationsRead",
      "decrementUnreadCount",
      "setCartOpen",
      "toggleNotificationsMuted",
      "toggleTypeMuted",
    ] as const;
    for (const key of fns) expect(result.current[key]).toBeTypeOf("function");
  });

  it("keeps the context value stable across re-renders with no changes", async () => {
    const { result, rerender } = await setup();
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe("signed out", () => {
  beforeEach(() => {
    h.user = null;
  });

  it("reports zeroed state and never touches Supabase", async () => {
    const { result } = await setup();

    expect(result.current).toMatchObject({
      cartCount: 0,
      favCount: 0,
      unreadCount: 0,
      latestNotification: null,
      isCartOpen: false,
      notificationsMuted: false,
      mutedTypes: [],
    });
    expect(fake.client.from).not.toHaveBeenCalled();
    expect(fake.client.channel).not.toHaveBeenCalled();
  });

  it("treats every mutation as a no-op", async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleNotificationsMuted();
      await result.current.toggleTypeMuted("promo");
      await result.current.markAllNotificationsRead();
    });

    expect(result.current.notificationsMuted).toBe(false);
    expect(result.current.mutedTypes).toEqual([]);
    expect(fake.client.from).not.toHaveBeenCalled();
  });
});

describe("initial load", () => {
  it("loads counts, unread total and mute settings", async () => {
    fake.routes["cart_items:select"] = { data: [{ quantity: 2 }, { quantity: null }, { quantity: 3 }], error: null };
    fake.routes["favorites:select"] = { count: 4, error: null };
    fake.routes["notifications:select"] = { count: 7, error: null };
    fake.routes["notification_settings:select"] = { data: { muted: true, muted_types: ["promo"] }, error: null };

    const { result } = await setup();

    expect(result.current.cartCount).toBe(5); // null quantity counts as 0
    expect(result.current.favCount).toBe(4);
    expect(result.current.unreadCount).toBe(7);
    expect(result.current.notificationsMuted).toBe(true);
    expect(result.current.mutedTypes).toEqual(["promo"]);
  });

  it.each([
    ["no settings row", null],
    ["null columns", { muted: null, muted_types: null }],
  ])("defaults to unmuted for %s", async (_label, row) => {
    fake.routes["notification_settings:select"] = { data: row, error: null };

    const { result } = await setup();

    expect(result.current.notificationsMuted).toBe(false);
    expect(result.current.mutedTypes).toEqual([]);
  });

  it("treats a null favorites count as 0", async () => {
    fake.routes["favorites:select"] = { count: null, error: null };

    const { result } = await setup();

    expect(result.current.favCount).toBe(0);
  });

  it("scopes every query to the signed-in user and attaches a timeout signal", async () => {
    await setup();

    const cart = fake.queriesFor("cart_items", "select")[0];
    expect(cart.columns).toBe("quantity");
    expect(cart.filters).toEqual([["user_id", "user_1"]]);
    expect(typeof cart.signal?.aborted).toBe("boolean");

    const favs = fake.queriesFor("favorites", "select")[0];
    expect(favs.columns).toBe("*");
    expect(favs.options).toEqual({ count: "exact", head: true });
    expect(favs.filters).toEqual([["user_id", "user_1"]]);

    const unread = fake.queriesFor("notifications", "select")[0];
    expect(unread.options).toEqual({ count: "exact", head: true });
    expect(unread.filters).toEqual([["user_id", "user_1"], ["is_read", false]]);

    const settings = fake.queriesFor("notification_settings", "select")[0];
    expect(settings.columns).toBe("muted, muted_types");
    expect(settings.single).toBe(true);
    expect(settings.filters).toEqual([["user_id", "user_1"]]);
  });
});

describe("error handling", () => {
  it("keeps the other count when one query returns an error", async () => {
    fake.routes["cart_items:select"] = { data: null, error: { code: "42P01", message: "missing" } };
    fake.routes["favorites:select"] = { count: 3, error: null };

    const { result } = await setup();

    expect(result.current.cartCount).toBe(0);
    expect(result.current.favCount).toBe(3);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to refresh cart count [42P01]",
      expect.objectContaining({ code: "42P01", message: "missing" }),
    );
  });

  it("explains a PGRST301 (Clerk JWT rejected) with setup guidance", async () => {
    fake.routes["notifications:select"] = { count: null, error: { code: "PGRST301", message: "JWT" } };

    await setup();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("PGRST301"), expect.anything());
  });

  it.each([
    ["a DOMException AbortError", () => new DOMException("aborted", "AbortError")],
    ["an Error named TimeoutError", () => Object.assign(new Error("timeout"), { name: "TimeoutError" })],
    ["an empty object", () => ({})],
  ])("stays silent when a request fails with %s", async (_label, makeError) => {
    fake.routes["cart_items:select"] = () => {
      throw makeError();
    };

    await setup();

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs unexpected thrown errors", async () => {
    fake.routes["cart_items:select"] = () => {
      throw new Error("boom");
    };

    await setup();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to refresh counts"), expect.anything());
  });
});

describe("JWT retry", () => {
  it("retries once after a JWT-not-ready error, then succeeds", async () => {
    let attempts = 0;
    fake.routes["cart_items:select"] = () =>
      ++attempts === 1 ? { data: null, error: { code: "PGRST303" } } : { data: [{ quantity: 4 }], error: null };

    const { result } = await setup();
    expect(attempts).toBe(1); // waiting out the retry delay
    expect(result.current.cartCount).toBe(0);

    await flush(300);

    expect(attempts).toBe(2);
    expect(result.current.cartCount).toBe(4);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("gives up after two attempts and logs the error", async () => {
    let attempts = 0;
    fake.routes["cart_items:select"] = () => {
      attempts++;
      return { data: null, error: { code: "PGRST303", message: "jwt" } };
    };

    await setup();
    await flush(5_000);

    expect(attempts).toBe(2);
    expect(errorSpy).toHaveBeenCalledWith("Failed to refresh cart count [PGRST303]", expect.anything());
  });

  it("does not retry non-JWT errors", async () => {
    let attempts = 0;
    fake.routes["cart_items:select"] = () => {
      attempts++;
      return { data: null, error: { code: "42P01" } };
    };

    await setup();
    await flush(5_000);

    expect(attempts).toBe(1);
  });
});

describe("refreshCounts and setters", () => {
  it("refreshCounts re-reads both counts", async () => {
    const { result } = await setup();
    expect(result.current.cartCount).toBe(0);

    fake.routes["cart_items:select"] = { data: [{ quantity: 6 }], error: null };
    fake.routes["favorites:select"] = { count: 2, error: null };
    await act(async () => {
      await result.current.refreshCounts();
    });

    expect(result.current.cartCount).toBe(6);
    expect(result.current.favCount).toBe(2);
  });

  it("setCartCount accepts values and updater functions", async () => {
    const { result } = await setup();

    act(() => result.current.setCartCount(9));
    expect(result.current.cartCount).toBe(9);

    act(() => result.current.setCartCount((n) => n + 1));
    expect(result.current.cartCount).toBe(10);
  });

  it("setCartOpen toggles the cart drawer flag", async () => {
    const { result } = await setup();

    act(() => result.current.setCartOpen(true));
    expect(result.current.isCartOpen).toBe(true);
  });
});

describe("unread notifications", () => {
  beforeEach(() => {
    fake.routes["notifications:select"] = { count: 3, error: null };
  });

  it("markAllNotificationsRead zeroes the badge immediately, then persists", async () => {
    const { result } = await setup();
    expect(result.current.unreadCount).toBe(3);

    act(() => {
      void result.current.markAllNotificationsRead();
    });
    expect(result.current.unreadCount).toBe(0); // optimistic
    await flush();

    const [update] = fake.queriesFor("notifications", "update");
    expect(update.payload).toEqual({ is_read: true });
    expect(update.filters).toEqual([["user_id", "user_1"], ["is_read", false]]);
  });

  it("markAllNotificationsRead does nothing when nothing is unread", async () => {
    fake.routes["notifications:select"] = { count: 0, error: null };
    const { result } = await setup();

    await act(async () => {
      await result.current.markAllNotificationsRead();
    });

    expect(fake.queriesFor("notifications", "update")).toHaveLength(0);
  });

  it("rolls the badge back when the update returns an error", async () => {
    fake.routes["notifications:update"] = { error: { code: "XX000", message: "db" } };
    const { result } = await setup();

    await act(async () => {
      await result.current.markAllNotificationsRead();
    });

    expect(result.current.unreadCount).toBe(3);
    expect(errorSpy).toHaveBeenCalledWith("Failed to mark notifications as read [XX000]", expect.anything());
  });

  it("rolls the badge back when the update throws", async () => {
    fake.routes["notifications:update"] = () => {
      throw new Error("network");
    };
    const { result } = await setup();

    await act(async () => {
      await result.current.markAllNotificationsRead();
    });

    expect(result.current.unreadCount).toBe(3);
  });

  it("decrementUnreadCount lowers the badge but never below zero", async () => {
    const { result } = await setup();

    act(() => result.current.decrementUnreadCount());
    expect(result.current.unreadCount).toBe(2);

    act(() => {
      for (let i = 0; i < 5; i++) result.current.decrementUnreadCount();
    });
    expect(result.current.unreadCount).toBe(0);
  });
});

describe("notification muting", () => {
  it("toggleNotificationsMuted flips optimistically and upserts", async () => {
    const { result } = await setup();

    act(() => {
      void result.current.toggleNotificationsMuted();
    });
    expect(result.current.notificationsMuted).toBe(true);
    await flush();

    const [upsert] = fake.queriesFor("notification_settings", "upsert");
    expect(upsert.payload).toMatchObject({ user_id: "user_1", muted: true });
    expect(typeof (upsert.payload as { updated_at: unknown }).updated_at).toBe("string");
    expect(upsert.payload).not.toHaveProperty("muted_types"); // must not clobber per-type mutes
    expect(upsert.options).toEqual({ onConflict: "user_id" });
  });

  it("rolls back, and stays consistent, after a failed save", async () => {
    fake.routes["notification_settings:upsert"] = { error: { code: "XX000", message: "db" } };
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleNotificationsMuted();
    });
    expect(result.current.notificationsMuted).toBe(false);

    await act(async () => {
      await result.current.toggleNotificationsMuted();
    });
    const payloads = fake.queriesFor("notification_settings", "upsert").map((q) => (q.payload as { muted: boolean }).muted);
    expect(payloads).toEqual([true, true]); // the rollback restored the ref too
  });

  it("two toggles in the same tick end back where they started", async () => {
    const { result } = await setup();

    act(() => {
      void result.current.toggleNotificationsMuted();
      void result.current.toggleNotificationsMuted();
    });
    await flush();

    const payloads = fake.queriesFor("notification_settings", "upsert").map((q) => (q.payload as { muted: boolean }).muted);
    expect(payloads).toEqual([true, false]);
    expect(result.current.notificationsMuted).toBe(false);
  });

  it("toggleTypeMuted adds and removes a type without touching `muted`", async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleTypeMuted("promo");
    });
    expect(result.current.mutedTypes).toEqual(["promo"]);

    await act(async () => {
      await result.current.toggleTypeMuted("promo");
    });
    expect(result.current.mutedTypes).toEqual([]);

    const upserts = fake.queriesFor("notification_settings", "upsert");
    expect(upserts.map((q) => (q.payload as { muted_types: string[] }).muted_types)).toEqual([["promo"], []]);
    expect(upserts[0].payload).not.toHaveProperty("muted");
  });

  it("keeps both types when two are toggled in the same tick", async () => {
    const { result } = await setup();

    act(() => {
      void result.current.toggleTypeMuted("promo");
      void result.current.toggleTypeMuted("order");
    });
    await flush();

    expect(result.current.mutedTypes).toEqual(["promo", "order"]);
  });

  it("restores the previous list when saving a type fails", async () => {
    fake.routes["notification_settings:select"] = { data: { muted: false, muted_types: ["promo"] }, error: null };
    fake.routes["notification_settings:upsert"] = { error: { code: "XX000", message: "db" } };
    const { result } = await setup();

    await act(async () => {
      await result.current.toggleTypeMuted("order");
    });

    expect(result.current.mutedTypes).toEqual(["promo"]);
    expect(errorSpy).toHaveBeenCalledWith("Failed to save per-type mute preference [XX000]", expect.anything());
  });
});

describe("auth changes", () => {
  it("resets everything when the user signs out", async () => {
    fake.routes["cart_items:select"] = { data: [{ quantity: 5 }], error: null };
    fake.routes["favorites:select"] = { count: 4, error: null };
    fake.routes["notifications:select"] = { count: 7, error: null };
    fake.routes["notification_settings:select"] = { data: { muted: true, muted_types: ["promo"] }, error: null };
    const { result, rerender } = await setup();
    expect(result.current.cartCount).toBe(5);

    h.user = null;
    rerender();
    await flush();

    expect(result.current).toMatchObject({
      cartCount: 0,
      favCount: 0,
      unreadCount: 0,
      notificationsMuted: false,
      mutedTypes: [],
    });
  });

  it("ignores a slow response that belongs to the previous user", async () => {
    const slow = deferred<QueryResult>();
    fake.routes["cart_items:select"] = (query) =>
      query.filters[0][1] === "user_1" ? slow.promise : { data: [{ quantity: 8 }], error: null };
    const { result, rerender } = await setup(); // user_1 is still pending

    h.user = { id: "user_2" };
    rerender();
    await flush();
    expect(result.current.cartCount).toBe(8);

    slow.resolve({ data: [{ quantity: 99 }], error: null });
    await flush();

    expect(result.current.cartCount).toBe(8);
  });

  it("refetches under the new user's id", async () => {
    const { rerender } = await setup();
    const before = cartQueries();

    h.user = { id: "user_2" };
    rerender();
    await flush();

    expect(cartQueries()).toBe(before + 1);
    expect(fake.queriesFor("cart_items", "select").at(-1)?.filters).toEqual([["user_id", "user_2"]]);
  });
});