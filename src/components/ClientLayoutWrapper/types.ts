import type { ReactNode } from "react";

export interface ClientLayoutWrapperProps {
  children: ReactNode;
}

/** A list of route prefixes, matched on path segments. */
export type RouteList = readonly string[];

/** Which pieces of global chrome to hide for the current route. */
export interface LayoutChrome {
  hideHeader: boolean;
  hideSeasonalBackground: boolean;
}