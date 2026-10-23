import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { CatalogItem } from "@/types/catalog";

import { EVENT_PREFILL_MENU, HIGHLIGHT_DURATION_MS } from "../constants";
import { isCategory } from "../lib/catalog";
import { findRequestedItem, getRequestedItems } from "../lib/prefill";
import { toPositiveInt } from "../lib/quantity";
import type { Category, PrefillMenuDetail } from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UsePrefillMenuOptions {
  items: readonly CatalogItem[];
  setActiveCategory: Dispatch<SetStateAction<Category>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  onAddToCart: (item: CatalogItem, quantity?: number) => void;
}

/**
 * Lets other parts of the app (e.g. the Cafe assistant) drive the menu via
 * the `cafe_prefill_menu` window event: set filters, add items to the cart
 * and highlight a card.
 */
export function usePrefillMenu({
  items,
  setActiveCategory,
  setSearchQuery,
  onAddToCart,
}: UsePrefillMenuOptions): { highlightedItemId: string | null } {
  const isMounted = useIsMounted();

  const itemsRef = useLatestRef(items);
  const onAddToCartRef = useLatestRef(onAddToCart);

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );

  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const handlePrefillMenu = (event: Event): void => {
      const detail = (event as CustomEvent<PrefillMenuDetail>).detail;

      if (!detail || typeof detail !== "object") return;

      const nextCategory = isCategory(detail.category) ? detail.category : null;
      const nextSearch =
        typeof detail.search === "string" ? detail.search : null;

      if (nextCategory !== null) setActiveCategory(nextCategory);
      if (nextSearch !== null) setSearchQuery(nextSearch);

      const currentItems = itemsRef.current;

      if (currentItems.length > 0) {
        for (const requested of getRequestedItems(detail)) {
          const matched = findRequestedItem(currentItems, requested);

          if (matched) {
            onAddToCartRef.current(matched, toPositiveInt(requested.quantity));
          }
        }
      }

      if (typeof detail.highlightItemId !== "string") return;

      const targetId = detail.highlightItemId;
      const target = currentItems.find((item) => item.id === targetId);

      // Make sure the highlighted card is not hidden by a stale filter.
      if (target) {
        if (nextCategory === null) {
          setActiveCategory((prev) =>
            prev === "All" || String(prev) === String(target.category)
              ? prev
              : "All",
          );
        }

        if (nextSearch === null) {
          setSearchQuery((prev) => {
            const needle = prev.trim().toLowerCase();

            if (!needle) return prev;

            return target.name.toLowerCase().includes(needle) ? prev : "";
          });
        }
      }

      setHighlightedItemId(targetId);

      if (highlightTimeoutRef.current !== null) {
        clearTimeout(highlightTimeoutRef.current);
      }

      highlightTimeoutRef.current = setTimeout(() => {
        highlightTimeoutRef.current = null;

        if (!isMounted()) return;

        setHighlightedItemId(null);
      }, HIGHLIGHT_DURATION_MS);
    };

    window.addEventListener(EVENT_PREFILL_MENU, handlePrefillMenu);

    return () => {
      window.removeEventListener(EVENT_PREFILL_MENU, handlePrefillMenu);

      if (highlightTimeoutRef.current !== null) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, [
    isMounted,
    itemsRef,
    onAddToCartRef,
    setActiveCategory,
    setSearchQuery,
  ]);

  return { highlightedItemId };
}
