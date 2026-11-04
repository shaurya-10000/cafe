// layout.test.tsx
//
// Integration tests for the root layout.
//
// Strategy:
//   * The layout is rendered for real with react-dom/server (no DOM needed),
//     and the returned element tree is inspected for props that are never
//     serialized to HTML (suppressHydrationWarning, Clerk URLs, Toaster props).
//   * Everything that only works inside Next.js or the browser is mocked:
//     next/font/google, globals.css, ClerkProvider, ClientLayoutWrapper, sonner.
//   * The palette anti-flash script is extracted from <head> and executed
//     against a fake localStorage / document, including failure paths.
//   * Module-level code (metadataBase, font config) is verified by
//     re-importing the layout under different env values.

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* -------------------------------------------------------------------------- */
/* Mocks                                                                      */
/* -------------------------------------------------------------------------- */

const mocks = vi.hoisted(() => ({
  inter: vi.fn(() => ({
    variable: "font-inter-var-mock",
    className: "font-inter-class-mock",
  })),
}));

vi.mock("next/font/google", () => ({ Inter: mocks.inter }));

vi.mock("./globals.css", () => ({}));

vi.mock("@clerk/nextjs", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    ClerkProvider: (props: { children?: ReactNode }) =>
      createElement(Fragment, null, props.children),
  };
});

vi.mock("@/components/ClientLayoutWrapper", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { children?: ReactNode }) =>
      createElement(
        "div",
        { "data-testid": "client-layout-wrapper" },
        props.children
      ),
  };
});

vi.mock("sonner", async () => {
  const { createElement } = await import("react");
  return {
    Toaster: () => createElement("div", { "data-testid": "toaster" }),
  };
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type El = ReactElement<Record<string, any>>;

const DEFAULT_SITE_URL = "https://cafe-ruddy-pi.vercel.app";
const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const PALETTES = ["espresso", "emerald", "rosewood", "champagne"] as const;

const elements = (node: ReactNode): El[] =>
  Children.toArray(node).filter(isValidElement) as El[];

async function loadLayout(siteUrl?: string) {
  vi.resetModules();
  if (siteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
  }
  mocks.inter.mockClear();
  return import("./layout");
}

const PAGE = <p id="page">page content</p>;

/** Walks the element tree returned by RootLayout. */
function inspect(mod: Awaited<ReturnType<typeof loadLayout>>) {
  const root = mod.default({ children: PAGE }) as El;
  const [html] = elements(root.props.children);
  const [head, body] = elements(html.props.children);
  const [script] = elements(head.props.children);
  const [wrapper, toaster] = elements(body.props.children);
  return { root, html, head, body, script, wrapper, toaster };
}

type Storage = { getItem: (key: string) => string | null };

/** Executes the anti-flash script against fake globals. */
function runPaletteScript(
  code: string,
  storage: Storage,
  setAttribute: ReturnType<typeof vi.fn> = vi.fn()
) {
  const doc = { documentElement: { setAttribute } };
  new Function("localStorage", "document", code)(storage, doc);
  return setAttribute;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  }
});

/* -------------------------------------------------------------------------- */
/* Module contract                                                            */
/* -------------------------------------------------------------------------- */

describe("module contract", () => {
  it("exports the default layout, metadata and viewport", async () => {
    const mod = await loadLayout();
    expect(Object.keys(mod).sort()).toEqual(["default", "metadata", "viewport"]);
    expect(typeof mod.default).toBe("function");
  });
});

/* -------------------------------------------------------------------------- */
/* Font                                                                       */
/* -------------------------------------------------------------------------- */

describe("Inter font", () => {
  it("is configured once with the expected options", async () => {
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

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

describe("metadata", () => {
  it("uses the title template and default", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.title).toEqual({ default: "Cafe", template: "%s | Cafe" });
  });

  it("describes the app", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.applicationName).toBe("Cafe");
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).length).toBeGreaterThan(40);
  });

  it("falls back to the production URL when NEXT_PUBLIC_SITE_URL is unset", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.metadataBase?.href).toBe(`${DEFAULT_SITE_URL}/`);
  });

  it("uses NEXT_PUBLIC_SITE_URL when provided", async () => {
    const { metadata } = await loadLayout("https://cafe.example.com");
    expect(metadata.metadataBase?.href).toBe("https://cafe.example.com/");
  });

  it("declares a PNG favicon fallback", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.icons).toEqual({
      icon: [{ url: "/pwa/48", sizes: "48x48", type: "image/png" }],
    });
  });

  it("declares Open Graph and Twitter defaults", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Cafe",
      url: "/",
      locale: "en_US",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("allows indexing and following", async () => {
    const { metadata } = await loadLayout();
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});

/* -------------------------------------------------------------------------- */
/* Viewport                                                                   */
/* -------------------------------------------------------------------------- */

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

  it("sets a theme color per color scheme", async () => {
    const { viewport } = await loadLayout();
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* Element tree                                                               */
/* -------------------------------------------------------------------------- */

describe("RootLayout element tree", () => {
  it("wraps everything in ClerkProvider with explicit auth URLs", async () => {
    const { root } = inspect(await loadLayout());
    expect(root.props.signInUrl).toBe("/sign-in");
    expect(root.props.signUpUrl).toBe("/sign-up");
  });

  it("sets lang, suppressHydrationWarning and the font variable on <html>", async () => {
    const { html } = inspect(await loadLayout());
    expect(html.type).toBe("html");
    expect(html.props.lang).toBe("en");
    expect(html.props.suppressHydrationWarning).toBe(true);
    expect(html.props.className).toBe("font-inter-var-mock");
  });

  it("renders <head> before <body>", async () => {
    const { head, body } = inspect(await loadLayout());
    expect(head.type).toBe("head");
    expect(body.type).toBe("body");
  });

  it("puts the palette script in <head> as a static inline script", async () => {
    const { script } = inspect(await loadLayout());
    expect(script.type).toBe("script");
    expect(typeof script.props.dangerouslySetInnerHTML.__html).toBe("string");
    expect(script.props.children).toBeUndefined();
  });

  it("applies the expected body classes", async () => {
    const { body } = inspect(await loadLayout());
    const classes = (body.props.className as string).split(" ");
    expect(classes).toEqual(
      expect.arrayContaining([
        "font-inter-class-mock",
        "antialiased",
        "bg-cafe-bg",
        "selection:bg-cafe-accent",
        "selection:text-cafe-accent-fg",
        "transition-colors",
        "duration-300",
      ])
    );
  });

  it("renders children inside ClientLayoutWrapper, followed by the Toaster", async () => {
    const { wrapper, toaster } = inspect(await loadLayout());
    const [page] = elements(wrapper.props.children);
    expect(page.type).toBe("p");
    expect(page.props.id).toBe("page");
    expect(page.props.children).toBe("page content");
    expect(toaster).toBeDefined();
  });

  it("configures the Toaster to match the app surface tokens", async () => {
    const { toaster } = inspect(await loadLayout());
    expect(toaster.props.position).toBe("bottom-right");
    expect(toaster.props.closeButton).toBe(true);
    expect(Object.keys(toaster.props.toastOptions.classNames).sort()).toEqual([
      "actionButton",
      "cancelButton",
      "description",
      "toast",
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* Server render                                                              */
/* -------------------------------------------------------------------------- */

describe("server-rendered markup", () => {
  async function render() {
    const mod = await loadLayout();
    return renderToStaticMarkup(mod.default({ children: PAGE }) as El);
  }

  it("renders html, head and body with the right attributes", async () => {
    const markup = await render();
    expect(markup).toMatch(/<html[^>]*\blang="en"/);
    expect(markup).toContain('class="font-inter-var-mock"');
    expect(markup).toMatch(/<head>.*<\/head><body/s);
    expect(markup).toMatch(/<body[^>]*class="[^"]*antialiased/);
  });

  it("inlines the palette script before the page content", async () => {
    const markup = await render();
    const scriptAt = markup.indexOf("cafe-color-palette");
    const pageAt = markup.indexOf('id="page"');
    expect(scriptAt).toBeGreaterThan(-1);
    expect(pageAt).toBeGreaterThan(scriptAt);
  });

  it("renders the page inside the client wrapper, before the toaster", async () => {
    const markup = await render();
    const wrapperAt = markup.indexOf('data-testid="client-layout-wrapper"');
    const pageAt = markup.indexOf('id="page"');
    const toasterAt = markup.indexOf('data-testid="toaster"');
    expect(wrapperAt).toBeGreaterThan(-1);
    expect(pageAt).toBeGreaterThan(wrapperAt);
    expect(toasterAt).toBeGreaterThan(pageAt);
  });
});

/* -------------------------------------------------------------------------- */
/* Palette anti-flash script                                                  */
/* -------------------------------------------------------------------------- */

describe("palette anti-flash script", () => {
  async function getScript() {
    const { script } = inspect(await loadLayout());
    return script.props.dangerouslySetInnerHTML.__html as string;
  }

  it("is syntactically valid and self-invoking", async () => {
    const code = await getScript();
    expect(() => new Function("localStorage", "document", code)).not.toThrow();
    expect(code.startsWith("(function(){")).toBe(true);
    expect(code.endsWith("})();")).toBe(true);
  });

  it("reads the cafe-color-palette key", async () => {
    const code = await getScript();
    const getItem = vi.fn().mockReturnValue(null);
    runPaletteScript(code, { getItem });
    expect(getItem).toHaveBeenCalledWith("cafe-color-palette");
  });

  it.each(PALETTES)("applies the stored palette %s", async (palette) => {
    const code = await getScript();
    const setAttribute = runPaletteScript(code, { getItem: () => palette });
    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(setAttribute).toHaveBeenCalledWith("data-color-theme", palette);
  });

  it.each([
    ["an unknown value", "neon"],
    ["an empty string", ""],
    ["a null value", null],
    ["a different casing", "Emerald"],
  ])("falls back to espresso for %s", async (_label, stored) => {
    const code = await getScript();
    const setAttribute = runPaletteScript(code, { getItem: () => stored });
    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(setAttribute).toHaveBeenCalledWith("data-color-theme", "espresso");
  });

  it("falls back to espresso when localStorage throws (private mode)", async () => {
    const code = await getScript();
    const setAttribute = runPaletteScript(code, {
      getItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(setAttribute).toHaveBeenCalledWith("data-color-theme", "espresso");
  });

  it("retries with the default if the first setAttribute throws", async () => {
    const code = await getScript();
    const setAttribute = vi.fn().mockImplementationOnce(() => {
      throw new Error("boom");
    });
    runPaletteScript(code, { getItem: () => "emerald" }, setAttribute);
    expect(setAttribute).toHaveBeenCalledTimes(2);
    expect(setAttribute).toHaveBeenLastCalledWith("data-color-theme", "espresso");
  });

  it("never throws, even if the document is unusable", async () => {
    const code = await getScript();
    const setAttribute = vi.fn(() => {
      throw new Error("boom");
    });
    expect(() =>
      runPaletteScript(code, { getItem: () => "emerald" }, setAttribute)
    ).not.toThrow();
  });
});