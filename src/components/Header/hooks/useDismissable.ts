import { useEffect, type RefObject } from "react";

interface UseDismissableOptions {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  /** Called on outside pointer-down and on Tab. */
  onDismiss: () => void;
  /** Called on Escape (typically also restores focus to the trigger). */
  onEscape: () => void;
}

export function useDismissable({
  enabled,
  containerRef,
  onDismiss,
  onEscape,
}: UseDismissableOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (!containerRef.current?.contains(target)) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      if (event.key === "Tab") {
        onDismiss();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, enabled, onDismiss, onEscape]);
}
