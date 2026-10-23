import { useLayoutEffect, useState, type RefObject } from "react";

/** Tracks an element's width via ResizeObserver (window resize as fallback). */
export function useMeasuredWidth(
  ref: RefObject<HTMLElement | null>,
  dependencyKey: string | number,
): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;

    if (!node) return;

    const measure = (): void => {
      const nextWidth = node.getBoundingClientRect().width;

      setWidth(Number.isFinite(nextWidth) && nextWidth > 0 ? nextWidth : 0);
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [dependencyKey, ref]);

  return width;
}
