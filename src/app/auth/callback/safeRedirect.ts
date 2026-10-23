/** Fallback when `redirect_url` is missing, malformed or unsafe. */
export const DEFAULT_REDIRECT_PATH = "/";

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * Turns an attacker-controllable `redirect_url` value into a path that is
 * guaranteed to stay on this origin.
 *
 * Layers, cheapest first:
 *  1. Missing -> default.
 *  2. Must start with a single "/": rejects absolute URLs ("https://..."),
 *     protocol-relative ("//host") and any backslash form ("/\host", "\\host"),
 *     because browsers and proxies treat backslashes like slashes.
 *  3. Control characters (tab, newline, ...) are rejected: the URL parser
 *     silently strips them, which can turn "/<TAB>/host" into "//host".
 *  4. Resolve with `URL` and require the same origin.
 *  5. Re-check the NORMALIZED path. Normalization can itself produce a
 *     protocol-relative path: "/.//evil.example" resolves to the pathname
 *     "//evil.example", which a browser would follow off-site. Checks 2-4 all
 *     pass for that input, so this last check is the one that matters.
 *
 * Returns the normalized path (never the raw input), so nothing smuggled in
 * the raw string reaches the Location header.
 */
export function getSafeRedirectPath(
  rawRedirect: string | null | undefined,
  origin: string,
): string {
  if (!rawRedirect) return DEFAULT_REDIRECT_PATH;

  if (
    !rawRedirect.startsWith("/") ||
    rawRedirect.startsWith("//") ||
    rawRedirect.includes("\\") ||
    CONTROL_CHARACTERS.test(rawRedirect)
  ) {
    return DEFAULT_REDIRECT_PATH;
  }

  let resolved: URL;
  try {
    resolved = new URL(rawRedirect, origin);
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }

  if (resolved.origin !== origin) return DEFAULT_REDIRECT_PATH;

  const path = resolved.pathname + resolved.search + resolved.hash;
  if (!path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return path;
}
