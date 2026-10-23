import type { RouteList } from "../types";

/** Strips a single trailing slash, except for the root "/". */
export function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * Segment-aware route match.
 *
 * `/auth` matches `/auth` and `/auth/anything`, but NOT `/author` or
 * `/authentication`. Trailing slashes are normalised so `/admin/` and
 * `/admin` behave identically.
 *
 * @param pathname - The current Next.js pathname (already URL-decoded).
 * @param routes   - The prefix list to test against.
 */
export function matchesRoute(pathname: string, routes: RouteList): boolean {
  const normalized = normalizePathname(pathname);

  for (const route of routes) {
    if (normalized === route) return true;
    if (normalized.startsWith(`${route}/`)) return true;
  }

  return false;
}