import { useCallback, useEffect, useState } from "react";

export interface UseSidebarResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Off-canvas navigation state; Escape closes it while open. */
export function useSidebar(): UseSidebarResult {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return { isOpen, open, close };
}
