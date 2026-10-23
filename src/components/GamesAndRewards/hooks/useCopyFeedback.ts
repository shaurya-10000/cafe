import { useCallback, useEffect, useRef, useState } from "react";
import { COPY_FEEDBACK_MS } from "../constants";
import type { CopyResult } from "../types";
import { useIsMounted } from "./useIsMounted";

/**
 * Copies text and exposes a short-lived `copied` flag. Reports the outcome so
 * the caller decides how to surface a failure (toast, inline, ...).
 */
export function useCopyFeedback() {
  const isMounted = useIsMounted();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const copy = useCallback(
    async (text: string): Promise<CopyResult> => {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return "unsupported";
      }

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Denied: insecure context, permission policy, or a stale browser.
        return "denied";
      }

      if (isMounted()) {
        setCopied(true);
        clearTimer();
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          setCopied(false);
        }, COPY_FEEDBACK_MS);
      }

      return "copied";
    },
    [clearTimer, isMounted],
  );

  return { copied, copy };
}
