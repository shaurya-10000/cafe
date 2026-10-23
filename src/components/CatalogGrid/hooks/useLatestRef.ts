import { useEffect, useRef, type MutableRefObject } from "react";

/** Keeps a ref pointing at the latest value without re-subscribing effects. */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}
