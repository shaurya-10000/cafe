// AppContext.component.test.tsx
// Rendering through real consumer components, clicks, and the audio-unlock
// gesture listeners. Supabase, Clerk, sonner and audio are mocked.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase, type FakeSupabase } from "./AppContext.fakes";

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

const flush = (ms = 0) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

function Consumer() {
  const app = mod.useApp();
  return (
    <div>
      <span data-testid="cart">{app.cartCount}</span>
      <span data-testid="favs">{app.favCount}</span>
      <span data-testid="unread">{app.unreadCount}</span>
      <span data-testid="cart-open">{String(app.isCartOpen)}</span>
      <span data-testid="muted">{String(app.notificationsMuted)}</span>
      <span data-testid="muted-types">{app.mutedTypes.join(",")}</span>
      <button onClick={() => app.setCartOpen(!app.isCartOpen)}>toggle cart</button>
      <button onClick={() => app.setCartCount((n) => n + 1)}>add to cart</button>
      <button onClick={() => void app.markAllNotificationsRead()}>mark read</button>
      <button onClick={() => app.decrementUnreadCount()}>decrement</button>
      <button onClick={() => void app.toggleNotificationsMuted()}>mute all</button>
      <button onClick={() => void app.toggleTypeMuted("promo")}>mute promo</button>
    </div>
  );
}

async function renderApp() {
  const view = render(
    <mod.AppProvider>
      <Consumer />
    </mod.AppProvider>,
  );
  await flush();
  return view;
}

const text = (id: string) => screen.getByTestId(id).textContent;

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByText(name));
    await vi.advanceTimersByTimeAsync(0);
  });
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
  vi.useRealTimers();
});

describe("provider rendering", () => {
  it("renders its children", async () => {
    render(
      <mod.AppProvider>
        <span>hello</span>
      </mod.AppProvider>,
    );
    await flush();

    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("makes useApp throw for a component outside the provider", () => {
    expect(() => render(<Consumer />)).toThrow("useApp must be used within AppProvider");
  });

  it("shows the loaded counts to consumers", async () => {
    fake.routes["cart_items:select"] = { data: [{ quantity: 2 }, { quantity: 1 }], error: null };
    fake.routes["favorites:select"] = { count: 5, error: null };
    fake.routes["notifications:select"] = { count: 2, error: null };

    await renderApp();

    expect(text("cart")).toBe("3");
    expect(text("favs")).toBe("5");
    expect(text("unread")).toBe("2");
  });
});

describe("consumer interactions", () => {
  it("toggles the cart drawer flag", async () => {
    await renderApp();
    expect(text("cart-open")).toBe("false");

    await click("toggle cart");
    expect(text("cart-open")).toBe("true");

    await click("toggle cart");
    expect(text("cart-open")).toBe("false");
  });

  it("updates the cart badge through setCartCount", async () => {
    await renderApp();

    await click("add to cart");
    await click("add to cart");

    expect(text("cart")).toBe("2");
  });

  it("marks notifications read from a button", async () => {
    fake.routes["notifications:select"] = { count: 3, error: null };
    await renderApp();
    expect(text("unread")).toBe("3");

    await click("mark read");

    expect(text("unread")).toBe("0");
    expect(fake.queriesFor("notifications", "update")).toHaveLength(1);
  });

  it("decrements the badge one at a time", async () => {
    fake.routes["notifications:select"] = { count: 2, error: null };
    await renderApp();

    await click("decrement");

    expect(text("unread")).toBe("1");
  });

  it("toggles global and per-type muting", async () => {
    await renderApp();

    await click("mute all");
    await click("mute promo");

    expect(text("muted")).toBe("true");
    expect(text("muted-types")).toBe("promo");
  });
});

describe("audio unlock gesture", () => {
  beforeEach(() => {
    h.user = null; // the listeners are independent of auth
  });

  it.each(["click", "keydown", "touchend"])("tries to unlock audio on %s", async (eventName) => {
    await renderApp();

    act(() => {
      window.dispatchEvent(new Event(eventName));
    });
    await flush();

    expect(h.unlock).toHaveBeenCalledTimes(1);
  });

  it("stops listening on every gesture type once unlock succeeds", async () => {
    await renderApp();

    for (const eventName of ["click", "keydown", "touchend"]) {
      act(() => {
        window.dispatchEvent(new Event(eventName));
      });
      await flush();
    }

    expect(h.unlock).toHaveBeenCalledTimes(1);
  });

  it("keeps listening while the browser still refuses to unlock", async () => {
    h.unlock.mockResolvedValue(false);
    await renderApp();

    for (let i = 0; i < 3; i++) {
      act(() => {
        window.dispatchEvent(new Event("click"));
      });
      await flush();
    }

    expect(h.unlock).toHaveBeenCalledTimes(3);
  });

  it("removes the listeners on unmount", async () => {
    const view = await renderApp();
    view.unmount();

    act(() => {
      window.dispatchEvent(new Event("click"));
    });
    await flush();

    expect(h.unlock).not.toHaveBeenCalled();
  });
});