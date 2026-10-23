import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable function that calls the latest `fn` once `delayMs` have
 * passed without another call. Pending calls are dropped on unmount.
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): T {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );

  return debounced as unknown as T;
}