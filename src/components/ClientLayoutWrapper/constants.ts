/**
 * Route prefixes where the global Header should be hidden.
 *
 * Match is on path *segments*, not raw `startsWith`. See `matchesRoute` —
 * the naive `startsWith("/auth")` also matches `/author`, `/authentic`,
 * `/authentication-guide`, etc., which is a real bug class for any site with
 * marketing pages named after verbs.
 */
export const HEADER_EXCLUDED_ROUTES = [
  "/auth",
  "/settings",
  "/admin",
  "/customer",
] as const;

/**
 * Route prefixes where the decorative SeasonalBackground should be disabled.
 *
 * Kept separate from HEADER_EXCLUDED_ROUTES on purpose: the two concerns are
 * independent (a future /pricing shell might want a header over a flat
 * background, or a marketing page might want the background without a
 * header). Collapsing them would force a refactor when that divergence
 * actually happens.
 */
export const BACKGROUND_EXCLUDED_ROUTES = [
  "/auth",
  "/settings",
  "/admin",
  "/customer",
] as const;