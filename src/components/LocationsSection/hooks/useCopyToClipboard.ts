import { useCallback, useEffect, useRef, useState } from "react";
import { COPY_FEEDBACK_MS } from "../constants";
import { writeToClipboard } from "../lib/clipboard";
import { useIsMounted } from "./useIsMounted";

export type CopyStatus = "idle" | "copied" | "error";

export function useCopyToClipboard() {
  const isMounted = useIsMounted();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<CopyStatus>("idle");

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const copy = useCallback(
    async (text: string) => {
      clearTimer();
      try {
        await writeToClipboard(text);
        if (!isMounted()) return;
        setStatus("copied");
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          setStatus("idle");
        }, COPY_FEEDBACK_MS);
      } catch (error) {
        console.warn("[LocationsSection] clipboard operation failed", error);
        if (!isMounted()) return;
        setStatus("error");
      }
    },
    [clearTimer, isMounted],
  );

  return { status, copy };
}
