// layout.component.test.tsx
//
// Component tests for RootLayout. The layout function is called directly and
// the returned element tree is inspected, which exposes props that are never
// serialized to HTML (suppressHydrationWarning, Clerk URLs, Toaster props).

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  elements,
  inspect,
  loadLayout,
  PAGE,
  restoreSiteUrl,
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

describe("tree structure", () => {
  it("renders html > [head, body] with nothing extra", async () => {
    const { root, html } = inspect(await loadLayout());
    expect(elements(root.props.children)).toHaveLength(1);
    expect(elements(html.props.children).map((el) => el.type)).toEqual([
      "head",
      "body",
    ]);
  });

  it("puts exactly one script in <head>", async () => {
    const { head } = inspect(await loadLayout());
    const children = elements(head.props.children);
    expect(children).toHaveLength(1);
    expect(children[0].type).toBe("script");
  });

  it("puts the client wrapper then the toaster in <body>", async () => {
    const { body, wrapper, toaster } = inspect(await loadLayout());
    expect(elements(body.props.children)).toHaveLength(2);
    expect(typeof wrapper.type).not.toBe("string");
    expect(typeof toaster.type).not.toBe("string");
  });
});

describe("ClerkProvider", () => {
  it("receives explicit sign-in and sign-up URLs", async () => {
    const { root } = inspect(await loadLayout());
    expect(root.props.signInUrl).toBe("/sign-in");
    expect(root.props.signUpUrl).toBe("/sign-up");
  });
});

describe("<html>", () => {
  it("sets lang, suppressHydrationWarning and the font variable", async () => {
    const { html } = inspect(await loadLayout());
    expect(html.type).toBe("html");
    expect(html.props.lang).toBe("en");
    expect(html.props.suppressHydrationWarning).toBe(true);
    expect(html.props.className).toBe("font-inter-var-mock");
  });
});

describe("<head> script", () => {
  it("is a static inline script with no src", async () => {
    const { script } = inspect(await loadLayout());
    expect(typeof script.props.dangerouslySetInnerHTML.__html).toBe("string");
    expect(script.props.children).toBeUndefined();
    expect(script.props.src).toBeUndefined();
  });
});

describe("<body>", () => {
  it("applies the expected classes without duplicates", async () => {
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
    expect(new Set(classes).size).toBe(classes.length);
    expect(classes).not.toContain("");
  });

  it("does not use inline styles", async () => {
    const { body } = inspect(await loadLayout());
    expect(body.props.style).toBeUndefined();
  });
});

describe("Toaster", () => {
  it("is positioned bottom-right with a close button", async () => {
    const { toaster } = inspect(await loadLayout());
    expect(toaster.props.position).toBe("bottom-right");
    expect(toaster.props.closeButton).toBe(true);
  });

  it("styles all four toast slots", async () => {
    const { toaster } = inspect(await loadLayout());
    expect(Object.keys(toaster.props.toastOptions.classNames).sort()).toEqual([
      "actionButton",
      "cancelButton",
      "description",
      "toast",
    ]);
  });

  it("marks every toast class as !important so it beats the library defaults", async () => {
    const { toaster } = inspect(await loadLayout());
    const classNames = toaster.props.toastOptions.classNames as Record<string, string>;
    for (const value of Object.values(classNames)) {
      for (const token of value.split(" ")) {
        expect(token.startsWith("!")).toBe(true);
      }
    }
  });
});

describe("children handling", () => {
  it("passes a single child through unchanged", async () => {
    const { wrapper } = inspect(await loadLayout());
    const [page] = elements(wrapper.props.children);
    expect(page.type).toBe("p");
    expect(page.props.id).toBe("page");
    expect(page.props.children).toBe("page content");
  });

  it("preserves the order of multiple children", async () => {
    const children = [<p key="a">first</p>, <span key="b">second</span>];
    const { wrapper } = inspect(await loadLayout(), children);
    expect(elements(wrapper.props.children).map((el) => el.type)).toEqual([
      "p",
      "span",
    ]);
  });

  it("tolerates missing children", async () => {
    const mod = await loadLayout();
    expect(() => mod.default({ children: undefined })).not.toThrow();
    const { wrapper } = inspect(mod, null);
    expect(elements(wrapper.props.children)).toHaveLength(0);
  });
});

describe("purity", () => {
  it("returns identical markup for identical input", async () => {
    const mod = await loadLayout();
    const render = () => renderToStaticMarkup(mod.default({ children: PAGE }) as El);
    expect(render()).toBe(render());
  });

  it("does not mutate the children it receives", async () => {
    const mod = await loadLayout();
    const children = <p id="stable">content</p>;
    const snapshot = JSON.stringify(children.props);
    mod.default({ children });
    expect(JSON.stringify(children.props)).toBe(snapshot);
  });
});