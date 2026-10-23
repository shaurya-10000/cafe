import { useEffect } from "react";

/**
 * Locks page scroll while active. Pads the body by the scrollbar's own width
 * so hiding it doesn't shove the page content sideways, and restores the
 * previous inline values (not just "was it hidden") on release.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPaddingRight = parseFloat(
        window.getComputedStyle(document.body).paddingRight || "0",
      );
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [active]);
}
