// ThemeProvider.test.ts
// Module-load contract: exported constants and the server-side palette drift guard.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";

import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// Nothing here renders; these mocks only keep the module's imports inert.
vi.mock("next-themes", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    ThemeProvider: ({ children }: { children?: unknown }) =>
      createElement(Fragment, null, children as never),
    useTheme: () => ({ theme: "system", setTheme: () => {} }),
  };
});
vi.mock("@/hooks/useHasMounted", () => ({ useHasMounted: () => true }));
vi.mock("@/lib/core/events", () => ({
  SET_THEME_MODE: "test:set-theme-mode",
  SET_COLOR_PALETTE: "test:set-color-palette",
  listenCafeEvent: () => () => {},
}));

const PALETTES = ["espresso", "emerald", "rosewood", "champagne"];

const layoutSource = (list: unknown[]) =>
  `export default function RootLayout() {
  return <script dangerouslySetInnerHTML={{ __html: "(function(){var v=${JSON.stringify(list)};})()" }} />;
}`;

const tmpDirs: string[] = [];
let cwdSpy: ReturnType<typeof vi.spyOn> | undefined;

afterEach(() => {
  cwdSpy?.mockRestore();
  cwdSpy = undefined;
  vi.unstubAllGlobals();
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

/**
 * Evaluates the module fresh. The drift guard runs at import time and only on
 * the server (`typeof window === "undefined"`), so server mode stubs `window`
 * for the duration of the import, then restores it. `require` is provided
 * explicitly because the guard uses a lazy `require("fs")` that some module
 * runners do not inject.
 */
async function importFresh(opts: { serverSide: boolean; files?: Record<string, string> }) {
  const dir = mkdtempSync(join(tmpdir(), "theme-provider-"));
  tmpDirs.push(dir);
  for (const [rel, body] of Object.entries(opts.files ?? {})) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(dir);
  if (opts.serverSide) {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("require", createRequire(import.meta.url));
  }
  vi.resetModules();
  try {
    return await import("./theme-provider");
  } finally {
    vi.unstubAllGlobals();
    cwdSpy.mockRestore();
    cwdSpy = undefined;
  }
}

describe("exported constants", () => {
  it("keeps the storage key stable (changing it silently resets every user's palette)", async () => {
    const mod = await importFresh({ serverSide: false });
    expect(mod.PALETTE_STORAGE_KEY).toBe("cafe-color-palette");
  });

  it("exposes the palettes in a fixed order", async () => {
    const mod = await importFresh({ serverSide: false });
    expect([...mod.VALID_PALETTES]).toEqual(PALETTES);
  });

  it("has no duplicate palettes", async () => {
    const mod = await importFresh({ serverSide: false });
    expect(new Set(mod.VALID_PALETTES).size).toBe(mod.VALID_PALETTES.length);
  });

  it("defaults to a palette that is actually valid", async () => {
    const mod = await importFresh({ serverSide: false });
    expect(mod.DEFAULT_PALETTE).toBe("espresso");
    expect(mod.VALID_PALETTES).toContain(mod.DEFAULT_PALETTE);
  });
});

describe("palette drift guard (server-side, import time)", () => {
  const drift = /\[theme-provider\] Palette drift detected/;

  it("does nothing in the browser, even when the layout disagrees", async () => {
    await expect(
      importFresh({
        serverSide: false,
        files: { "app/layout.tsx": layoutSource(["only-one"]) },
      }),
    ).resolves.toBeDefined();
  });

  it("passes when the layout list matches exactly", async () => {
    await expect(
      importFresh({ serverSide: true, files: { "app/layout.tsx": layoutSource(PALETTES) } }),
    ).resolves.toBeDefined();
  });

  it.each([
    ["a palette was removed from the layout", PALETTES.slice(0, 3)],
    ["a palette was added to the layout", [...PALETTES, "obsidian"]],
    ["the order differs", [...PALETTES].reverse()],
    ["a palette was renamed", ["espresso", "emerald", "rosewood", "champagne-2"]],
  ])("throws when %s", async (_label, list) => {
    await expect(
      importFresh({ serverSide: true, files: { "app/layout.tsx": layoutSource(list) } }),
    ).rejects.toThrow(drift);
  });

  it("ignores non-string entries in the layout list", async () => {
    await expect(
      importFresh({
        serverSide: true,
        files: { "app/layout.tsx": layoutSource([...PALETTES, 1, null]) },
      }),
    ).resolves.toBeDefined();
  });

  it("stays silent when the layout file does not exist", async () => {
    await expect(importFresh({ serverSide: true })).resolves.toBeDefined();
  });

  it("stays silent when the layout has no anti-flash palette list", async () => {
    await expect(
      importFresh({
        serverSide: true,
        files: { "app/layout.tsx": "export default function L() { return null; }" },
      }),
    ).resolves.toBeDefined();
  });

  it("swallows a malformed list instead of breaking the import", async () => {
    await expect(
      importFresh({
        serverSide: true,
        files: { "app/layout.tsx": "var v=[espresso, emerald];" },
      }),
    ).resolves.toBeDefined();
  });

  it("KNOWN GAP: only <cwd>/app/layout.tsx is inspected, never <cwd>/src/app/layout.tsx", async () => {
    // If your layout lives under src/app, the guard above never runs. This pins
    // that behavior; when you fix the path, flip this test to expect the throw.
    await expect(
      importFresh({
        serverSide: true,
        files: { "src/app/layout.tsx": layoutSource(["wrong"]) },
      }),
    ).resolves.toBeDefined();
  });
});
