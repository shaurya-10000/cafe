import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

/**
 * Ref that always holds the latest value, so long-lived listeners can read
 * current props without being re-attached every time they change.
 */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
