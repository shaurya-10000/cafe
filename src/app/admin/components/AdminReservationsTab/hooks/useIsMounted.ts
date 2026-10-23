import { useCallback, useEffect, useRef } from "react";

/** Returns a stable getter that is `true` only while the component is mounted. */
export function useIsMounted(): () => boolean {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
