"use client";

import { useEffect, useRef } from "react";

/** Structural ref type so both React 18 and 19 ref objects are assignable. */
export interface MountedRef {
  readonly current: boolean;
}

/** Guards async continuations against setting state after unmount. */
export function useIsMountedRef(): MountedRef {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}