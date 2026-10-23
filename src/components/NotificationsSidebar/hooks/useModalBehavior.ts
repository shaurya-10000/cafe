import { useEffect } from "react";
import { useLatestRef } from "./useLatestRef";

/**
 * While open: locks body scroll and closes on Escape. `onClose` is held in a
 * ref so the keydown listener is not torn down on every parent re-render.
 */
export function useModalBehavior(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useLatestRef(onClose);

  useEffect(() => {
    if (!isOpen) return;

    // Preserve the inline value (not just "was it hidden") so we don't
    // clobber a pre-existing lock another component owns when we restore.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCloseRef]);
}
