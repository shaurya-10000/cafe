import { useEffect, type RefObject } from "react";

import { useReducedMotion } from "framer-motion";

import type { CatalogItem } from "@/types/catalog";

import { findCardElement } from "../lib/dom";

interface UseHighlightScrollOptions {
  highlightedItemId: string | null;
  processedItems: readonly CatalogItem[];
  visibleCount: number;
  revealIndex: (index: number) => void;
  containerRef: RefObject<HTMLElement | null>;
}

/** Reveals the highlighted card (paging if needed) and scrolls it into view. */
export function useHighlightScroll({
  highlightedItemId,
  processedItems,
  visibleCount,
  revealIndex,
  containerRef,
}: UseHighlightScrollOptions): void {
  const prefersReducedMotion = useReducedMotion() === true;

  useEffect(() => {
    if (!highlightedItemId) return;

    const index = processedItems.findIndex(
      (item) => item.id === highlightedItemId,
    );

    if (index !== -1 && index >= visibleCount) {
      revealIndex(index);
    }
  }, [highlightedItemId, processedItems, revealIndex, visibleCount]);

  useEffect(() => {
    if (!highlightedItemId) return;

    const frame = requestAnimationFrame(() => {
      findCardElement(containerRef.current, highlightedItemId)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [containerRef, highlightedItemId, prefersReducedMotion, visibleCount]);
}
