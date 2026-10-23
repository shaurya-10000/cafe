import { useCallback, useEffect, useRef, useState } from "react";
import { getFocusableElements } from "../lib/focus";

/**
 * Modal drawer behaviour: scroll lock, Escape to close, Tab trapped inside,
 * focus moved in on open and handed back to the trigger on close.
 *
 * The trap is deliberately small (cycle Tab over the drawer's focusable set).
 * Leaving Tab unconstrained would let focus escape into the page behind a
 * modal, which fails WCAG 2.4.3 (focus order).
 */
export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const restoreFrameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (restoreFrameRef.current !== null) {
        cancelAnimationFrame(restoreFrameRef.current);
      }
    },
    [],
  );

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);

    // Defer until the exit transition has committed so the browser doesn't
    // scroll to a focus target that is still mid-flight.
    if (restoreFrameRef.current !== null) {
      cancelAnimationFrame(restoreFrameRef.current);
    }
    restoreFrameRef.current = requestAnimationFrame(() => {
      restoreFrameRef.current = null;
      triggerRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Preserve the inline value so we don't clobber a lock someone else owns.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => {
      const root = drawerRef.current;
      (getFocusableElements(root)[0] ?? root)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(drawerRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  return { isOpen, open, close, drawerRef, triggerRef };
}
