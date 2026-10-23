import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

/**
 * Ref that always holds the latest value. Lets long-lived listeners read
 * current state without being re-attached every time it changes.
 */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
