// layout.metadata.test.ts
//
// Unit tests for the static exports of the root layout: font configuration,
// metadata and viewport. Module-level code (metadataBase, font options) is
// verified by re-importing the layout under different env values.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SITE_URL,
  loadLayout,
  restoreSiteUrl,
} from "./layout.test-utils";

const mocks = vi.hoisted(() => ({
  inter: vi.fn(() => ({
    variable: "font-inter-var-mock",
    className: "font-inter-class-mock",
  })),
}));

vi.mock("next/font/google", () => ({ Inter: mocks.inter }));
vi.mock("./globals.css", () => ({}));
vi.mock("@clerk/nextjs", () => ({ ClerkProvider: () => null }));
vi.mock("@/components/ClientLayoutWrapper", () => ({ default: () => null }));
vi.mock("sonner", () => ({ Toaster: () => null }));

afterEach(() => {
  restoreSiteUrl();
  mocks.inter.mockClear();
});

describe("module contract", () => {
  it("exports exactly the default layout, metadata and viewport", async () => {
    const mod = await loadLayout();
    expect(Object.keys(mod).sort()).toEqual(["default", "metadata", "viewport"]);
    expect(typeof mod.default).toBe("function");
  });
});

describe("Inter font", () => {
  it("is configured exactly once with the expected options", async () => {
    await loadLayout();
    expect(mocks.inter).toHaveBeenCalledTimes(1);
    expect(mocks.inter).toHaveBeenCalledWith({
      subsets: ["latin"],
      display: "swap",
      variable: "--font-inter",
      weight: ["400", "500", "700", "900"],
      preload: true,
    });
  });
});

describe("metadata", () => {
  it("uses the title default and template", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.title).toEqual({ default: "Cafe", template: "%s | Cafe" });
  });

  it("formats page titles through the template", async () => {
    const { metadata } = await loadLayout();
    const template = (metadata.title as { template: string }).template;
    expect(template.replace("%s", "Menu")).toBe("Menu | Cafe");
  });

  it("has a description within SEO-friendly bounds", async () => {
    const { metadata } = await loadLayout();
    const description = metadata.description as string;
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("names the application", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.applicationName).toBe("Cafe");
  });

  it("declares a PNG favicon fallback", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.icons).toEqual({
      icon: [{ url: "/pwa/48", sizes: "48x48", type: "image/png" }],
    });
  });

  it("declares Open Graph defaults", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Cafe",
      url: "/",
      locale: "en_US",
    });
  });

  it("declares a large Twitter card", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("allows indexing and following", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});

describe("metadataBase / NEXT_PUBLIC_SITE_URL", () => {
  it("falls back to the production URL when unset", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect((metadata.metadataBase as URL).href).toBe(`${DEFAULT_SITE_URL}/`);
  });

  it("defaults to https", async () => {
    const { metadata } = await loadLayout();
    expect((metadata.metadataBase as URL).protocol).toBe("https:");
  });

  it.each([
    ["https://cafe.example.com", "https://cafe.example.com/"],
    ["https://cafe.example.com/", "https://cafe.example.com/"],
    ["https://staging.cafe.example.com", "https://staging.cafe.example.com/"],
    ["http://localhost:3000", "http://localhost:3000/"],
  ])("normalizes %s", async (input, expectedHref) => {
    const { metadata } = await loadLayout(input);
    expect((metadata.metadataBase as URL).href).toBe(expectedHref);
  });

  it("resolves the relative Open Graph url against metadataBase", async () => {
    const { metadata } = await loadLayout("https://cafe.example.com");
    const ogUrl = (metadata.openGraph as { url: string }).url;
    expect(new URL(ogUrl, metadata.metadataBase ?? undefined).href).toBe(
      "https://cafe.example.com/"
    );
  });

  it("fails fast on a malformed URL", async () => {
    await expect(loadLayout("not a url")).rejects.toThrow();
  });
});

describe("viewport", () => {
  it("is responsive and covers the safe area", async () => {
    const { viewport } = await loadLayout();
    expect(viewport).toMatchObject({
      width: "device-width",
      initialScale: 1,
      viewportFit: "cover",
      interactiveWidget: "resizes-content",
    });
  });

  it("never locks pinch-zoom (accessibility)", async () => {
    const { viewport } = await loadLayout();
    expect(viewport).not.toHaveProperty("maximumScale");
    expect(viewport).not.toHaveProperty("userScalable");
  });

  it("sets a theme color for light and dark schemes", async () => {
    const { viewport } = await loadLayout();
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ]);
  });

  it("uses valid hex colors", async () => {
    const { viewport } = await loadLayout();
    for (const entry of viewport.themeColor as Array<{ color: string }>) {
      expect(entry.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});