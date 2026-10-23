import {
  BACKGROUND_EXCLUDED_ROUTES,
  HEADER_EXCLUDED_ROUTES,
} from "../constants";
import type { LayoutChrome } from "../types";
import { matchesRoute } from "./routes";

const SHOW_ALL_CHROME: LayoutChrome = {
  hideHeader: false,
  hideSeasonalBackground: false,
};

/**
 * `usePathname()` returns `string | null` in the App Router. Null means we're
 * rendering during a transition where the target path isn't yet known — show
 * chrome (the safe default) rather than flashing it off.
 */
export function resolveLayoutChrome(pathname: string | null): LayoutChrome {
  if (!pathname) {
    return SHOW_ALL_CHROME;
  }

  return {
    hideHeader: matchesRoute(pathname, HEADER_EXCLUDED_ROUTES),
    hideSeasonalBackground: matchesRoute(pathname, BACKGROUND_EXCLUDED_ROUTES),
  };
}