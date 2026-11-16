// ThemeProvider.component.test.tsx
// next-themes, useHasMounted and the event bus are mocked so every branch of
// ThemeBridge can be driven deterministically.
import { act, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SET_COLOR_PALETTE, SET_THEME_MODE } from "@/lib/core/events";

const h = vi.hoisted(() => {
  type Handler = (event: { detail?: unknown }) => void;
  const handlers = new Map<string, Set<Handler>>();
  return {
    handlers,
    nextThemes: {
      theme: "system" as string | undefined,
      setTheme: vi.fn(),
      providerProps: [] as Array<Record<string, unknown>>,
    },
    hasMounted: { value: true },
    listen: vi.fn((name: string, handler: Handler) => {
      let set = handlers.get(name);
      if (!set) {
        set = new Set();
        handlers.set(name, set);
      }
      set.add(handler);
      return () => {
        handlers.get(name)?.delete(handler);
      };
    }),
  };
});

vi.mock("next-themes", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    ThemeProvider: (props: Record<string, unknown>) => {
      const { children, ...rest } = props;
      h.nextThemes.providerProps.push(rest);
      return createElement(Fragment, null, children as ReactNode);
    },
    useTheme: () => ({ theme: h.nextThemes.theme, setTheme: h.nextThemes.setTheme }),
  };
});

vi.mock("@/hooks/useHasMounted", () => ({ useHasMounted: () => h.hasMounted.value }));

vi.mock("@/lib/core/events", () => ({
  SET_THEME_MODE: "test:set-theme-mode",
  SET_COLOR_PALETTE: "test:set-color-palette",
  listenCafeEvent: h.listen,
}));

type Mod = typeof import("./theme-provider");
type Theme = ReturnType<Mod["useCafeTheme"]>;

let mod: Mod;
let latest!: Theme;
const restorers: Array<() => void> = [];

function Probe({ onRender }: { onRender?: (value: Theme) => void }) {
  const value = mod.useCafeTheme();
  // Capture after commit: assigning outer variables during render is impure.
  useEffect(() => {
    latest = value;
    onRender?.(value);
  });
  return (
    <div
      data-testid="probe"
      data-mode={String(value.mode)}
      data-palette={value.colorPalette}
      data-mounted={String(value.mounted)}
    />
  );
}

function tree(onRender?: (value: Theme) => void) {
  return (
    <mod.ThemeProvider>
      <Probe onRender={onRender} />
    </mod.ThemeProvider>
  );
}

const renderProvider = () => render(tree());

function emit(name: string, detail?: unknown) {
  act(() => {
    h.handlers.get(name)?.forEach((fn) => fn({ detail }));
  });
}

const listenerCount = (name: string) => h.handlers.get(name)?.size ?? 0;

/** Replaces window.localStorage; restored automatically after the test. */
function withStorage(fake: Partial<Storage>) {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", { configurable: true, value: fake });
  restorers.push(() => {
    if (original) Object.defineProperty(window, "localStorage", original);
    else delete (window as unknown as Record<string, unknown>).localStorage;
  });
}

beforeEach(async () => {
  // `isolate: false`: module-level state (inMemoryPalette, listeners) would
  // leak between tests and files, so every test gets a freshly evaluated module.
  h.handlers.clear();
  h.nextThemes.theme = "system";
  h.nextThemes.setTheme.mockReset();
  h.nextThemes.providerProps.length = 0;
  h.hasMounted.value = true;
  h.listen.mockClear();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-color-theme");

  vi.resetModules();
  mod = await import("./theme-provider");
});

afterEach(() => {
  while (restorers.length) restorers.pop()!();
});

describe("useCafeTheme", () => {
  it("throws a helpful error outside <ThemeProvider>", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Probe />)).toThrow("useCafeTheme must be used within a <ThemeProvider>.");
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("composition", () => {
  it("renders its children", () => {
    render(
      <mod.ThemeProvider>
        <span>hello</span>
      </mod.ThemeProvider>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("configures next-themes for class-based, system-aware, flash-free switching", () => {
    renderProvider();
    expect(h.nextThemes.providerProps.at(-1)).toMatchObject({
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      disableTransitionOnChange: true,
    });
  });
});

describe("initial state", () => {
  it("starts on the default palette with nothing stored", () => {
    renderProvider();
    expect(latest.colorPalette).toBe("espresso");
  });

  it("reads a valid stored palette on the client", () => {
    window.localStorage.setItem(mod.PALETTE_STORAGE_KEY, "rosewood");
    renderProvider();
    expect(latest.colorPalette).toBe("rosewood");
  });

  it.each([["neon"], [""], ["ESPRESSO"], ["null"]])(
    "falls back to the default for an invalid stored value (%j)",
    (stored) => {
      window.localStorage.setItem(mod.PALETTE_STORAGE_KEY, stored);
      renderProvider();
      expect(latest.colorPalette).toBe("espresso");
    },
  );

  it("falls back to the default when reading storage throws", () => {
    withStorage({
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
    });
    renderProvider();
    expect(latest.colorPalette).toBe("espresso");
  });

  it("exposes next-themes' theme as `mode` once mounted", () => {
    h.nextThemes.theme = "dark";
    renderProvider();
    expect(latest.mode).toBe("dark");
    expect(latest.mounted).toBe(true);
  });

  it("hides `mode` until mounted (avoids hydration mismatches)", () => {
    h.hasMounted.value = false;
    h.nextThemes.theme = "dark";
    renderProvider();
    expect(latest.mode).toBeUndefined();
    expect(latest.mounted).toBe(false);
  });

  it("tracks theme changes coming from next-themes", () => {
    h.nextThemes.theme = "light";
    const { rerender } = renderProvider();
    expect(latest.mode).toBe("light");

    h.nextThemes.theme = "dark";
    rerender(tree());
    expect(latest.mode).toBe("dark");
  });

  it("server render ignores storage and reports the unmounted default state", () => {
    window.localStorage.setItem(mod.PALETTE_STORAGE_KEY, "rosewood");
    h.hasMounted.value = false;

    const html = renderToString(tree());

    expect(html).toContain('data-palette="espresso"');
    expect(html).toContain('data-mounted="false"');
    expect(html).toContain('data-mode="undefined"');
  });
});

describe("setColorPalette", () => {
  it("updates context, the <html> attribute and storage together", () => {
    renderProvider();

    act(() => latest.setColorPalette("emerald"));

    expect(latest.colorPalette).toBe("emerald");
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("emerald");
    expect(window.localStorage.getItem(mod.PALETTE_STORAGE_KEY)).toBe("emerald");
  });

  it.each([["neon"], [""], [undefined], [null], [42]])(
    "ignores an invalid palette (%j) without side effects",
    (bad) => {
      renderProvider();

      act(() => latest.setColorPalette(bad as never));

      expect(latest.colorPalette).toBe("espresso");
      expect(document.documentElement.hasAttribute("data-color-theme")).toBe(false);
      expect(window.localStorage.getItem(mod.PALETTE_STORAGE_KEY)).toBeNull();
    },
  );

  it("still applies the palette when storage writes fail (quota / private mode)", () => {
    withStorage({
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    });
    renderProvider();

    expect(() => act(() => latest.setColorPalette("champagne"))).not.toThrow();

    expect(latest.colorPalette).toBe("champagne");
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("champagne");
  });
});

describe("setMode", () => {
  it.each([["light"], ["dark"], ["system"]])("forwards %s to next-themes", (mode) => {
    renderProvider();
    act(() => latest.setMode(mode as never));
    expect(h.nextThemes.setTheme).toHaveBeenCalledExactlyOnceWith(mode);
  });

  it.each([[""], ["auto"], ["Dark"], [undefined], [null], [1]])(
    "rejects an invalid mode (%j)",
    (bad) => {
      renderProvider();
      act(() => latest.setMode(bad as never));
      expect(h.nextThemes.setTheme).not.toHaveBeenCalled();
    },
  );
});

describe("cafe events", () => {
  it("subscribes to both events only after mount", () => {
    h.hasMounted.value = false;
    const { rerender } = renderProvider();
    expect(listenerCount(SET_THEME_MODE)).toBe(0);
    expect(listenerCount(SET_COLOR_PALETTE)).toBe(0);

    h.hasMounted.value = true;
    rerender(tree());
    expect(listenerCount(SET_THEME_MODE)).toBe(1);
    expect(listenerCount(SET_COLOR_PALETTE)).toBe(1);
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderProvider();
    unmount();
    expect(listenerCount(SET_THEME_MODE)).toBe(0);
    expect(listenerCount(SET_COLOR_PALETTE)).toBe(0);
  });

  it("does not resubscribe on re-render or palette changes", () => {
    const { rerender } = renderProvider();
    expect(h.listen).toHaveBeenCalledTimes(2);

    act(() => latest.setColorPalette("emerald"));
    rerender(tree());

    expect(h.listen).toHaveBeenCalledTimes(2);
  });

  it("applies a valid SET_THEME_MODE event", () => {
    renderProvider();
    emit(SET_THEME_MODE, { mode: "dark" });
    expect(h.nextThemes.setTheme).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it.each([
    ["no detail", undefined],
    ["null detail", null],
    ["empty detail", {}],
    ["unknown mode", { mode: "auto" }],
    ["non-string mode", { mode: 1 }],
    ["a palette payload on the mode channel", { palette: "emerald" }],
  ])("ignores a SET_THEME_MODE event with %s", (_label, detail) => {
    renderProvider();
    emit(SET_THEME_MODE, detail);
    expect(h.nextThemes.setTheme).not.toHaveBeenCalled();
  });

  it("applies a valid SET_COLOR_PALETTE event", () => {
    renderProvider();
    emit(SET_COLOR_PALETTE, { palette: "rosewood" });
    expect(latest.colorPalette).toBe("rosewood");
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("rosewood");
  });

  it.each([
    ["no detail", undefined],
    ["null detail", null],
    ["empty detail", {}],
    ["unknown palette", { palette: "neon" }],
    ["non-string palette", { palette: 7 }],
    ["a mode payload on the palette channel", { mode: "dark" }],
  ])("ignores a SET_COLOR_PALETTE event with %s", (_label, detail) => {
    renderProvider();
    emit(SET_COLOR_PALETTE, detail);
    expect(latest.colorPalette).toBe("espresso");
    expect(document.documentElement.hasAttribute("data-color-theme")).toBe(false);
  });
});

describe("context value identity", () => {
  it("keeps the same context object when nothing changed", () => {
    const seen: Theme[] = [];
    const { rerender } = render(tree((v) => seen.push(v)));

    rerender(tree((v) => seen.push(v)));

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen.at(-1)).toBe(seen.at(-2));
  });

  it("keeps setters referentially stable across palette changes", () => {
    renderProvider();
    const { setColorPalette, setMode } = latest;

    act(() => latest.setColorPalette("emerald"));

    expect(latest.setColorPalette).toBe(setColorPalette);
    expect(latest.setMode).toBe(setMode);
  });

  it("produces a new context object when the palette changes", () => {
    renderProvider();
    const before = latest;

    act(() => latest.setColorPalette("champagne"));

    expect(latest).not.toBe(before);
  });
});

describe("cross-tab storage sync", () => {
  it("follows a `storage` event from another tab until a local selection is made", () => {
    renderProvider();

    window.localStorage.setItem(mod.PALETTE_STORAGE_KEY, "champagne");
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });

    expect(latest.colorPalette).toBe("champagne");
  });

  it("KNOWN LIMITATION: after a local choice, later storage events are ignored", () => {
    // getPaletteSnapshot() prefers the in-memory value once publishPalette()
    // has run, so another tab's change no longer reaches this tab. Pinned so a
    // fix (e.g. clearing the in-memory cache on `storage`) is a visible change.
    renderProvider();
    act(() => latest.setColorPalette("rosewood"));

    window.localStorage.setItem(mod.PALETTE_STORAGE_KEY, "emerald");
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });

    expect(latest.colorPalette).toBe("rosewood");
  });

  it("removes its `storage` listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    try {
      const { unmount } = renderProvider();
      unmount();
      expect(removeSpy.mock.calls.some(([type]) => type === "storage")).toBe(true);
    } finally {
      removeSpy.mockRestore();
    }
  });
});