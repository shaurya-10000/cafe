import { useCallback, useEffect, useRef, useState } from "react";

/** State that automatically resets to `null` after `timeoutMs`. */
export function useTimedState<T>(
  timeoutMs: number,
): [T | null, (value: T | null) => void] {
  const [value, setValue] = useState<T | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback(
    (next: T | null) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setValue(next);

      if (next !== null) {
        timeoutRef.current = setTimeout(() => {
          setValue(null);
          timeoutRef.current = null;
        }, timeoutMs);
      }
    },
    [timeoutMs],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return [value, set];
}
