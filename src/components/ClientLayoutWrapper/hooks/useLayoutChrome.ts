"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { resolveLayoutChrome } from "../lib/chrome";
import type { LayoutChrome } from "../types";

/** Which global chrome (header, seasonal background) the current route hides. */
export function useLayoutChrome(): LayoutChrome {
  const pathname = usePathname();

  return useMemo(() => resolveLayoutChrome(pathname), [pathname]);
}