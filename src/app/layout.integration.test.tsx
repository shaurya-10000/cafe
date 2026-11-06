// layout.integration.test.tsx
//
// Integration tests: the real layout is rendered to a complete HTML string
// with react-dom/server and the resulting document is verified as a browser
// would receive it. Only framework- and vendor-specific pieces are mocked
// (next/font, CSS, ClerkProvider, ClientLayoutWrapper, sonner).
//
// The palette script is pulled out of the *rendered HTML* and executed, so
// this suite proves the whole chain: constant -> React -> markup -> runtime.

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadLayout,
  PALETTES,
  restoreSiteUrl,
  runPaletteScript,
  type El,
} from "./layout.test-utils";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var-mock", className: "font-inter-class-mock" }),
}));
vi.mock("./globals.css", () => ({}));
vi.mock("@clerk/nextjs", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    ClerkProvider: (props: { children?: React.ReactNode }) =>
      createElement(Fragment, null, props.children),
  };
});
vi.mock("@/components/ClientLayoutWrapper", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { children?: React.ReactNode }) =>
      createElement("div", { "data-testid": "client-layout-wrapper" }, props.children),
  };
});
vi.mock("sonner", async () => {
  const { createElement } = await import("react");
  return { Toaster: () => createElement("div", { "data-testid": "toaster" }) };
});

afterEach(restoreSiteUrl);

async function render(children: React.ReactNode): Promise<string> {
  const mod = await loadLayout();
  return renderToStaticMarkup(mod.default({ children }) as El);
}

const count = (haystack: string, pattern: RegExp): number =>
  (haystack.match(pattern) ?? []).length;

const inlineScripts = (markup: string): string[] =>
  [...markup.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

describe("document structure", () => {
  it("emits exactly one html, head and body element", async () => {
    const markup = await render(<p>hi</p>);
    expect(count(markup, /<html[\s>]/g)).toBe(1);
    expect(count(markup, /<head[\s>]/g)).toBe(1);
    expect(count(markup, /<body[\s>]/g)).toBe(1);
  });

  it("orders html, head, body correctly", async () => {
    const markup = await render(<p>hi</p>);
    const html = markup.indexOf("<html");
    const head = markup.indexOf("<head");
    const body = markup.indexOf("<body");
    expect(html).toBeGreaterThanOrEqual(0);
    expect(head).toBeGreaterThan(html);
    expect(body).toBeGreaterThan(head);
  });

  it("declares the document language exactly once", async () => {
    const markup = await render(<p>hi</p>);
    expect(count(markup, /\blang="en"/g)).toBe(1);
  });

  it("wires the font variable onto <html> and the font class onto <body>", async () => {
    const markup = await render(<p>hi</p>);
    expect(markup).toMatch(/<html[^>]*class="font-inter-var-mock"/);
    expect(markup).toMatch(/<body[^>]*class="[^"]*font-inter-class-mock/);
  });
});

describe("scripts", () => {
  it("renders exactly one inline script and no external scripts", async () => {
    const markup = await render(<p>hi</p>);
    expect(count(markup, /<script[\s>]/g)).toBe(1);
    expect(markup).not.toMatch(/<script[^>]*\bsrc=/);
    expect(inlineScripts(markup)).toHaveLength(1);
  });

  it("places the script inside <head>, before <body>", async () => {
    const markup = await render(<p>hi</p>);
    const script = markup.indexOf("<script>");
    expect(script).toBeGreaterThan(markup.indexOf("<head"));
    expect(script).toBeLessThan(markup.indexOf("</head>"));
    expect(script).toBeLessThan(markup.indexOf("<body"));
  });
});

describe("palette script, end to end", () => {
  async function scriptFromMarkup(): Promise<string> {
    const [code] = inlineScripts(await render(<p>hi</p>));
    return code;
  }

  it.each(PALETTES)("applies the stored palette %s", async (palette) => {
    const setAttribute = runPaletteScript(await scriptFromMarkup(), {
      getItem: () => palette,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-color-theme", palette);
  });

  it("applies the default palette when nothing is stored", async () => {
    const setAttribute = runPaletteScript(await scriptFromMarkup(), {
      getItem: () => null,
    });
    expect(setAttribute).toHaveBeenCalledWith("data-color-theme", "espresso");
  });

  it("is not altered by HTML serialization", async () => {
    const mod = await loadLayout();
    const markup = renderToStaticMarkup(mod.default({ children: <p>hi</p> }) as El);
    const [fromMarkup] = inlineScripts(markup);
    expect(fromMarkup).not.toContain("&quot;");
    expect(fromMarkup).not.toContain("&amp;");
    expect(fromMarkup).not.toContain("&lt;");
  });
});

describe("children rendering", () => {
  it("renders nested content inside the client wrapper, in order", async () => {
    const markup = await render(
      <main>
        <h1>Menu</h1>
        <ul>
          <li>Latte</li>
          <li>Mocha</li>
        </ul>
      </main>
    );
    expect(markup).toContain(
      '<div data-testid="client-layout-wrapper"><main><h1>Menu</h1><ul><li>Latte</li><li>Mocha</li></ul></main></div>'
    );
  });

  it("renders the toaster after the page content", async () => {
    const markup = await render(<p id="page">content</p>);
    expect(markup.indexOf('data-testid="toaster"')).toBeGreaterThan(
      markup.indexOf('id="page"')
    );
  });

  it("renders an empty wrapper when there are no children", async () => {
    const markup = await render(null);
    expect(markup).toContain('<div data-testid="client-layout-wrapper"></div>');
  });

  it("escapes markup-looking text instead of injecting it", async () => {
    const markup = await render("<script>alert(1)</script>");
    expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(inlineScripts(markup)).toHaveLength(1);
  });
});

describe("determinism", () => {
  it("renders identical markup on repeated renders", async () => {
    const first = await render(<p>same</p>);
    const second = await render(<p>same</p>);
    expect(first).toBe(second);
  });

  it("keeps the document shell identical regardless of page content", async () => {
    const shell = (markup: string) =>
      markup.slice(0, markup.indexOf('<div data-testid="client-layout-wrapper"'));
    const a = shell(await render(<p>a</p>));
    const b = shell(await render(<section>b</section>));
    expect(a).toBe(b);
  });
});