"use client";

import { useEffect, useState } from "react";

import { useHasMounted } from "@/hooks/useHasMounted";

/**
 * `mounted` is the SSR-safe gate; `visible` flips one animation frame later so
 * the layer can fade in.
 */
export function useMountedFadeIn(): { mounted: boolean; visible: boolean } {
  const mounted = useHasMounted();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return { mounted, visible };
}