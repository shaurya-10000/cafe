// layout.test-utils.tsx
//
// Shared helpers for the layout test suites. Not a test file (the name does
// not match *.test.ts(x)), so vitest never collects it.
//
// vi.mock() calls must live in each test file; this module only holds
// mock-agnostic helpers.

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { vi } from "vitest";

export type El = ReactElement<Record<string, any>>;
export type LayoutModule = typeof import("./layout");
export type FakeStorage = { getItem: (key: string) => string | null };

export const DEFAULT_SITE_URL = "https://cafe-ruddy-pi.vercel.app";
export const PALETTES = ["espresso", "emerald", "rosewood", "champagne"] as const;
export const PAGE: El = <p id="page">page content</p>;

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

/** Children.toArray() clones elements with keys, so compare by type/props, not identity. */
export const elements = (node: ReactNode): El[] =>
  Children.toArray(node).filter(isValidElement) as El[];

/** Re-imports layout.tsx fresh so module-level code runs under the given env. */
export async function loadLayout(siteUrl?: string): Promise<LayoutModule> {
  vi.resetModules();
  if (siteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
  }
  return import("./layout");
}

export function restoreSiteUrl(): void {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  }
}

/** Walks the element tree returned by RootLayout. */
export function inspect(mod: LayoutModule, children: ReactNode = PAGE) {
  const root = mod.default({ children }) as El;
  const [html] = elements(root.props.children);
  const [head, body] = elements(html.props.children);
  const [script] = elements(head.props.children);
  const [wrapper, toaster] = elements(body.props.children);
  return { root, html, head, body, script, wrapper, toaster };
}

export function getPaletteScript(mod: LayoutModule): string {
  return inspect(mod).script.props.dangerouslySetInnerHTML.__html as string;
}

/** Executes the anti-flash script against fake globals. */
export function runPaletteScript(
  code: string,
  storage: FakeStorage,
  setAttribute: ReturnType<typeof vi.fn> = vi.fn()
) {
  const doc = { documentElement: { setAttribute } };
  new Function("localStorage", "document", code)(storage, doc);
  return setAttribute;
}