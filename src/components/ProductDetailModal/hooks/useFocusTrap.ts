import { useEffect } from "react";
import type { RefObject } from "react";
import { FOCUSABLE_SELECTOR } from "../constants";
import { useLatestRef } from "./useLatestRef";

/**
 * While active: moves focus into the container, traps Tab inside it, calls
 * `onEscape` on Escape, and on release returns focus to whatever had it
 * before. `onEscape` lives in a ref so a parent passing a fresh callback each
 * render does not re-run the effect (which would re-capture the wrong
 * "previously focused" element from inside the dialog).
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  const onEscapeRef = useLatestRef(onEscape);

  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ) ?? [],
      );

    // Wait a frame for the entrance animation's first render to commit.
    const frame = requestAnimationFrame(() => {
      (getFocusable()[0] ?? containerRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);

      // The opener can leave the DOM while the modal is open (a realtime
      // deactivation, or filters changed behind it); only restore focus to
      // an element that still exists.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, onEscapeRef]);
}
