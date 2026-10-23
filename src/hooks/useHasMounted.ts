"use client";

import { useSyncExternalStore } from "react";

const subscribe = (): (() => void) => () => {};

/**
 * `false` during SSR and the hydration render, `true` afterwards.
 *
 * Built on useSyncExternalStore (server snapshot false, client snapshot true)
 * instead of `useEffect(() => setMounted(true))`, which forces a second render
 * pass through an effect for no reason.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}