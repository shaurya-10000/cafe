"use client";

import { useEffect, useRef } from "react";

import { focusFirst, trapTab } from "../lib/focus";

/**
 * Focus trap + Escape-to-close + body-scroll lock. Moves focus into the
 * dialog on open, cycles Tab inside it, and restores focus on close.
 *
 * `onClose` is read through a ref so the effect runs exactly once per
 * mount. Depending on it directly would re-run the effect (re-locking
 * scroll and yanking focus back to the first control) every time the parent
 * re-creates its close handler.
 */
export function useDialogBehavior(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Declared before the main effect so it always runs first.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const raf = requestAnimationFrame(() => focusFirst(dialogRef.current));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      trapTab(event, dialogRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return dialogRef;
}