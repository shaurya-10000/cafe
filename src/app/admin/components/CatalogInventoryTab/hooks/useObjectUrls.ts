import { useEffect, useMemo } from "react";

const NO_URLS: string[] = [];

/**
 * Object URLs for local previews.
 *
 * The URL is DERIVED (useMemo), not mirrored into state: mirroring required a
 * setState-in-effect, which React 19's `react-hooks/set-state-in-effect` rule
 * forbids. The only side effect is revocation, handled by the effect below.
 *
 * "No file" is derived from the input, so nothing needs to be reset.
 */
export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  // Revoke the *previous* URL when the file changes, or on unmount.
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}

export function useObjectUrls(files: readonly File[]): string[] {
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    if (urls.length === 0) return;
    return () => urls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
  }, [urls]);

  return files.length === 0 ? NO_URLS : urls;
}