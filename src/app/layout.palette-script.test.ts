// layout.palette-script.test.ts
//
// Unit tests for the palette anti-flash script. The script is extracted from
// the layout's <head> and executed against fake localStorage / document
// objects, including every failure path it is meant to survive.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPaletteScript,
  loadLayout,
  PALETTES,
  restoreSiteUrl,
  runPaletteScript,
} from "./layout.test-utils";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var-mock", className: "font-inter-class-mock" }),
}));
vi.mock("./globals.css", () => ({}));
vi.mock("@clerk/nextjs", () => ({ ClerkProvider: () => null }));
vi.mock("@/components/ClientLayoutWrapper", () => ({ default: () => null }));
vi.mock("sonner", () => ({ Toaster: () => null }));

afterEach(restoreSiteUrl);

const loadScript = async () => getPaletteScript(await loadLayout());

const expectFallback = (setAttribute: ReturnType<typeof vi.fn>) => {
  expect(setAttribute).toHaveBeenCalledTimes(1);
  expect(setAttribute).toHaveBeenCalledWith("data-color-theme", "espresso");
};

describe("script hygiene", () => {
  it("is syntactically valid and self-invoking", async () => {
    const code = await loadScript();
    expect(() => new Function("localStorage", "document", code)).not.toThrow();
    expect(code.startsWith("(function(){")).toBe(true);
    expect(code.endsWith("})();")).toBe(true);
  });

  it("stays small enough for the critical rendering path", async () => {
    const code = await loadScript();
    expect(Buffer.byteLength(code)).toBeLessThan(512);
  });

  it("cannot break out of its <script> element", async () => {
    const code = await loadScript();
    expect(code.toLowerCase()).not.toContain("</script");
    expect(code).not.toContain("<!--");
  });

  it("has no unresolved template placeholders", async () => {
    const code = await loadScript();
    expect(code).not.toContain("${");
    expect(code).not.toContain("undefined");
  });

  it("sticks to ES5 syntax so it runs in any browser", async () => {
    const code = await loadScript();
    expect(code).not.toMatch(/\b(let|const|class)\b/);
    expect(code).not.toContain("=>");
    expect(code).not.toContain("`");
  });

  it("makes no network or global-window access", async () => {
    const code = await loadScript();
    expect(code).not.toMatch(/\b(fetch|XMLHttpRequest|window|eval)\b/);
  });
});

describe("reading the stored palette", () => {
  it("reads the cafe-color-palette key", async () => {
    const getItem = vi.fn().mockReturnValue(null);
    runPaletteScript(await loadScript(), { getItem });
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(getItem).toHaveBeenCalledWith("cafe-color-palette");
  });

  it.each(PALETTES)("applies the stored palette %s", async (palette) => {
    const setAttribute = runPaletteScript(await loadScript(), {
      getItem: () => palette,
    });
    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(setAttribute).toHaveBeenCalledWith("data-color-theme", palette);
  });

  it("falls back to espresso when nothing is stored (null)", async () => {
    expectFallback(runPaletteScript(await loadScript(), { getItem: () => null }));
  });

  it.each([
    "neon",
    "",
    "ESPRESSO",
    "Emerald",
    " emerald",
    "emerald\n",
    "espresso ",
    "null",
    "undefined",
    "__proto__",
    "constructor",
    "toString",
    "length",
    "0",
  ])("falls back to espresso for the stored value %j", async (value) => {
    expectFallback(
      runPaletteScript(await loadScript(), { getItem: () => value })
    );
  });

  it("falls back for non-string values from a misbehaving storage", async () => {
    expectFallback(
      runPaletteScript(await loadScript(), {
        getItem: (() => 5) as unknown as () => string | null,
      })
    );
  });
});

describe("failure handling", () => {
  it("falls back to espresso when localStorage throws (private mode)", async () => {
    const code = await loadScript();
    const setAttribute = runPaletteScript(code, {
      getItem: () => {
        throw new Error("SecurityError");
      },
    });
    expectFallback(setAttribute);
  });

  it("retries with the default if the first setAttribute throws", async () => {
    const code = await loadScript();
    const setAttribute = vi.fn().mockImplementationOnce(() => {
      throw new Error("boom");
    });
    runPaletteScript(code, { getItem: () => "emerald" }, setAttribute);
    expect(setAttribute).toHaveBeenCalledTimes(2);
    expect(setAttribute).toHaveBeenLastCalledWith("data-color-theme", "espresso");
  });

  it("never throws, even if the document is unusable", async () => {
    const code = await loadScript();
    const setAttribute = vi.fn(() => {
      throw new Error("boom");
    });
    expect(() =>
      runPaletteScript(code, { getItem: () => "emerald" }, setAttribute)
    ).not.toThrow();
  });

  it("never throws if both localStorage and the document fail", async () => {
    const code = await loadScript();
    const setAttribute = vi.fn(() => {
      throw new Error("boom");
    });
    expect(() =>
      runPaletteScript(
        code,
        {
          getItem: () => {
            throw new Error("SecurityError");
          },
        },
        setAttribute
      )
    ).not.toThrow();
  });
});