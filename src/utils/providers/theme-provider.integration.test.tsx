// ThemeProvider.integration.test.tsx
// Real next-themes + real useHasMounted + real DOM/localStorage. Only the cafe
// event bus is replaced with a tiny in-memory one so events can be fired.
import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SET_COLOR_PALETTE, SET_THEME_MODE } from "@/lib/core/events";

const bus = vi.hoisted(() => {
  type Handler = (event: { detail?: unknown }) => void;
  const handlers = new Map<string, Set<Handler>>();
  return {
    handlers,
    listen: (name: string, handler: Handler) => {
      let set = handlers.get(name);
      if (!set) {
        set = new Set();
        handlers.set(name, set);
      }
      set.add(handler);
      return () => {
        handlers.get(name)?.delete(handler);
      };
    },
  };
});

vi.mock("@/lib/core/events", () => ({
  SET_THEME_MODE: "test:set-theme-mode",
  SET_COLOR_PALETTE: "test:set-color-palette",
  listenCafeEvent: bus.listen,
}));

type Mod = typeof import("./theme-provider");
type Theme = ReturnType<Mod["useCafeTheme"]>;
type Sink = { current?: Theme };

let mod: Mod;
let latest!: Theme;
let errorSpy: ReturnType<typeof vi.spyOn>;

function Probe({ onValue }: { onValue?: (value: Theme) => void }) {
  const value = mod.useCafeTheme();
  // Capture after commit: assigning outer variables during render is impure.
  useEffect(() => {
    latest = value;
    onValue?.(value);
  });
  return <div data-testid="probe" data-mode={String(value.mode)} data-palette={value.colorPalette} />;
}

const renderProvider = () =>
  render(
    <mod.ThemeProvider>
      <Probe />
    </mod.ThemeProvider>,
  );

async function loadFresh() {
  // Drops module-level state (the in-memory palette) to simulate a page reload.
  vi.resetModules();
  mod = await import("./theme-provider");
}

function emit(name: string, detail?: unknown) {
  act(() => {
    bus.handlers.get(name)?.forEach((fn) => fn({ detail }));
  });
}

const html = () => document.documentElement;
const mounted = () => waitFor(() => expect(latest.mounted).toBe(true));

beforeEach(async () => {
  bus.handlers.clear();
  window.localStorage.clear();
  html().className = "";
  html().removeAttribute("data-color-theme");
  html().removeAttribute("style");

  if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // next-themes renders an inline <script>; React 19 warns about that in dev.
  const original = console.error.bind(console);
  errorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("script tag")) return;
    original(...args);
  });

  await loadFresh();
});

afterEach(() => {
  errorSpy.mockRestore();
  html().className = "";
  html().removeAttribute("data-color-theme");
  html().removeAttribute("style");
  window.localStorage.clear();
});

describe("boot", () => {
  it("mounts into system mode on the default palette", async () => {
    renderProvider();
    await mounted();

    expect(latest.mode).toBe("system");
    expect(latest.colorPalette).toBe("espresso");
  });
});

describe("mode switching through the real next-themes", () => {
  it.each([["dark"], ["light"]])("applies %s to <html> and persists it", async (mode) => {
    renderProvider();
    await mounted();

    act(() => latest.setMode(mode as never));

    await waitFor(() => expect(html().classList.contains(mode)).toBe(true));
    expect(latest.mode).toBe(mode);
    expect(window.localStorage.getItem("theme")).toBe(mode);
  });

  it("swaps the class when going dark → light", async () => {
    renderProvider();
    await mounted();

    act(() => latest.setMode("dark"));
    await waitFor(() => expect(html().classList.contains("dark")).toBe(true));

    act(() => latest.setMode("light"));
    await waitFor(() => expect(html().classList.contains("light")).toBe(true));
    expect(html().classList.contains("dark")).toBe(false);
  });
});

describe("palette switching", () => {
  it("applies the palette to <html>, storage and context", async () => {
    renderProvider();
    await mounted();

    act(() => latest.setColorPalette("emerald"));

    expect(latest.colorPalette).toBe("emerald");
    expect(html().getAttribute("data-color-theme")).toBe("emerald");
    expect(window.localStorage.getItem(mod.PALETTE_STORAGE_KEY)).toBe("emerald");
  });

  it("keeps palette and mode independent of each other", async () => {
    renderProvider();
    await mounted();

    act(() => latest.setColorPalette("rosewood"));
    expect(html().classList.contains("dark")).toBe(false);
    expect(latest.mode).toBe("system");

    act(() => latest.setMode("dark"));
    await waitFor(() => expect(html().classList.contains("dark")).toBe(true));
    expect(html().getAttribute("data-color-theme")).toBe("rosewood");
    expect(latest.colorPalette).toBe("rosewood");
  });
});

describe("persistence across a reload", () => {
  it("restores both mode and palette from storage", async () => {
    const first = renderProvider();
    await mounted();
    act(() => latest.setMode("dark"));
    act(() => latest.setColorPalette("champagne"));
    await waitFor(() => expect(window.localStorage.getItem("theme")).toBe("dark"));
    first.unmount();

    await loadFresh();
    renderProvider();
    await mounted();

    expect(latest.colorPalette).toBe("champagne");
    expect(latest.mode).toBe("dark");
    await waitFor(() => expect(html().classList.contains("dark")).toBe(true));
  });

  it("falls back to defaults when stored values are garbage", async () => {
    window.localStorage.setItem(mod.PALETTE_STORAGE_KEY, "neon");
    renderProvider();
    await mounted();

    expect(latest.colorPalette).toBe("espresso");
  });
});

describe("cafe event bus end to end", () => {
  it("SET_THEME_MODE switches the real theme", async () => {
    renderProvider();
    await mounted();

    emit(SET_THEME_MODE, { mode: "dark" });

    await waitFor(() => expect(html().classList.contains("dark")).toBe(true));
    expect(latest.mode).toBe("dark");
  });

  it("SET_COLOR_PALETTE switches and persists the palette", async () => {
    renderProvider();
    await mounted();

    emit(SET_COLOR_PALETTE, { palette: "rosewood" });

    expect(latest.colorPalette).toBe("rosewood");
    expect(html().getAttribute("data-color-theme")).toBe("rosewood");
    expect(window.localStorage.getItem(mod.PALETTE_STORAGE_KEY)).toBe("rosewood");
  });

  it("leaves everything untouched for malformed payloads", async () => {
    renderProvider();
    await mounted();

    emit(SET_THEME_MODE, { mode: "sepia" });
    emit(SET_THEME_MODE, undefined);
    emit(SET_COLOR_PALETTE, { palette: "neon" });
    emit(SET_COLOR_PALETTE, null);

    expect(latest.mode).toBe("system");
    expect(latest.colorPalette).toBe("espresso");
    expect(html().hasAttribute("data-color-theme")).toBe(false);
    expect(html().classList.contains("dark")).toBe(false);
  });

  it("stops reacting after unmount", async () => {
    const view = renderProvider();
    await mounted();
    view.unmount();

    expect(bus.handlers.get(SET_THEME_MODE)?.size ?? 0).toBe(0);
    expect(bus.handlers.get(SET_COLOR_PALETTE)?.size ?? 0).toBe(0);

    emit(SET_COLOR_PALETTE, { palette: "emerald" });
    expect(html().hasAttribute("data-color-theme")).toBe(false);
  });
});

describe("shared palette store", () => {
  it("keeps every consumer under one provider in sync", async () => {
    const a: Sink = {};
    const b: Sink = {};
    render(
      <mod.ThemeProvider>
        <Probe onValue={(v) => { a.current = v; }} />
        <Probe onValue={(v) => { b.current = v; }} />
      </mod.ThemeProvider>,
    );
    await mounted();

    act(() => a.current!.setColorPalette("emerald"));

    expect(a.current!.colorPalette).toBe("emerald");
    expect(b.current!.colorPalette).toBe("emerald");
  });

  it("is module-global: separate provider instances share the palette (pinned)", async () => {
    const a: Sink = {};
    const b: Sink = {};
    render(
      <>
        <mod.ThemeProvider>
          <Probe onValue={(v) => { a.current = v; }} />
        </mod.ThemeProvider>
        <mod.ThemeProvider>
          <Probe onValue={(v) => { b.current = v; }} />
        </mod.ThemeProvider>
      </>,
    );
    await mounted();

    act(() => a.current!.setColorPalette("champagne"));

    expect(b.current!.colorPalette).toBe("champagne");
  });
});