import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

/** Ref that always holds the latest value, for long-lived listeners. */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
