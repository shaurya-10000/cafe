import { useEffect, useSyncExternalStore, type RefObject } from "react";

const subscribeNever = (): (() => void) => () => {};

/** `true` when the browser supports the `inert` attribute (client-only). */
export function useInertSupport(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => typeof HTMLElement !== "undefined" && "inert" in HTMLElement.prototype,
    () => false,
  );
}

/**
 * Marks an element `inert` so assistive tech and keyboard users skip it.
 * `dependencyKey` re-applies the attribute if the node is re-created.
 */
export function useInertAttribute(
  ref: RefObject<HTMLElement | null>,
  supported: boolean,
  dependencyKey: string | number,
): void {
  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    if (supported) {
      node.setAttribute("inert", "");

      return () => {
        node.removeAttribute("inert");
      };
    }

    node.removeAttribute("inert");
  }, [dependencyKey, ref, supported]);
}