import { useEffect } from "react";

import { useLatestRef } from "./useLatestRef";

export function useEscapeKey(enabled: boolean, onEscape: () => void): void {
  const onEscapeRef = useLatestRef(onEscape);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      onEscapeRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onEscapeRef]);
}
