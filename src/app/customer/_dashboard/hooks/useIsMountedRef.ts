"use client";

import { useEffect, useRef } from "react";

import type { MountedRef } from "../types";

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