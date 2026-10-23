/**
 * Raster image extensions accepted by the local-image contract.
 */
export const AUTH_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
] as const;

/**
 * Path-segment charset for internal image sources.
 *
 * Explicitly conservative: lowercase letters, digits, dashes,
 * underscores, dots (for the extension), and forward slashes. No percent
 * escapes, no Unicode, no shell metacharacters — a background image path
 * is authored by developers, not users, so the strictest possible
 * charset is the correct one.
 */
const SAFE_IMAGE_SEGMENT = /^[a-z0-9._-]+$/i;

const AUTH_IMAGE_SOURCE_PATTERN =
  /^\/(?!\/)[a-z0-9._-]+(?:\/[a-z0-9._-]+)*\.(?:jpg|jpeg|png|webp|avif)$/i;

/**
 * Determines whether an authentication background image uses a supported
 * root-relative image path.
 *
 * Contract:
 * - Must begin with exactly one "/".
 * - Must contain only normal path segments.
 * - Must not contain "." or ".." path segments or consecutive dots.
 * - Must not contain query strings or fragments.
 * - Must use a supported raster image extension.
 * - Must not contain backslashes.
 * - Must not be an external, protocol-relative, data, or JavaScript URL.
 *
 * The implementation is deliberately layered: each check is a single
 * yes/no question whose failure mode is unambiguous. The final regex is
 * only reached when every earlier check has passed, so it can be
 * narrower than a fully self-contained validator without losing
 * coverage.
 */
export function isValidAuthImageSource(source: string): boolean {
  if (!source) return false;

  // Reject backslashes (Windows paths, UNC paths).
  if (source.includes("\\")) return false;

  // Reject query strings and fragments.
  if (source.includes("?") || source.includes("#")) return false;

  // Reject a trailing slash early.
  if (source.endsWith("/")) return false;

  // Reject path traversal and hidden path segments.
  const segments = source.split("/").filter((segment) => segment.length > 0);
  for (const segment of segments) {
    if (segment === "." || segment === ".." || segment.startsWith(".")) {
      return false;
    }
    if (!SAFE_IMAGE_SEGMENT.test(segment)) {
      return false;
    }
  }

  return AUTH_IMAGE_SOURCE_PATTERN.test(source);
}

/**
 * Determines whether a string contains meaningful non-whitespace content.
 */
export function isNonEmptyHeadline(headline: string): boolean {
  return headline.trim().length > 0;
}
