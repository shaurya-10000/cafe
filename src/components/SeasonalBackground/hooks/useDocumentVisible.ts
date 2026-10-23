"use client";

import { useEffect, useState } from "react";

export function useDocumentVisible(enabled: boolean): boolean {
  const [documentVisible, setDocumentVisible] = useState(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const update = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };

    update();

    document.addEventListener("visibilitychange", update);

    return () => {
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled]);

  return documentVisible;
}