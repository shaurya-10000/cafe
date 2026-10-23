import { useCallback, useEffect, useRef, useState } from "react";

import type { CatalogItem } from "@/types/catalog";

import { ADD_TO_CART_CONFIRM_MS, EVENT_ADD_TO_CART } from "../constants";
import { toPositiveInt } from "../lib/quantity";
import type { AddItemHandler, CartItemInput } from "../types";
import { useIsMounted } from "./useIsMounted";

interface UseCartFeedbackOptions {
  onAddItem: AddItemHandler;
  formatPrice: (value: number) => string;
}

export interface UseCartFeedbackResult {
  recentlyAddedIds: ReadonlySet<string>;
  handleAddToCart: (item: CatalogItem, quantity?: number) => void;
}

export function useCartFeedback({
  onAddItem,
  formatPrice,
}: UseCartFeedbackOptions): UseCartFeedbackResult {
  const isMounted = useIsMounted();

  const [recentlyAddedIds, setRecentlyAddedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const handleAddToCart = useCallback(
    (item: CatalogItem, quantity = 1): void => {
      const safeQuantity = toPositiveInt(quantity);

      const payload: CartItemInput = {
        id: item.id,
        name: item.name,
        price: formatPrice(item.numeric_price),
        numeric_price: item.numeric_price,
      };

      onAddItem(payload, safeQuantity);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(EVENT_ADD_TO_CART, {
            detail: { ...payload, quantity: safeQuantity },
          }),
        );
      }

      setRecentlyAddedIds((prev) => new Set(prev).add(item.id));

      const existing = timeoutsRef.current.get(item.id);
      if (existing) clearTimeout(existing);

      timeoutsRef.current.set(
        item.id,
        setTimeout(() => {
          timeoutsRef.current.delete(item.id);

          if (!isMounted()) return;

          setRecentlyAddedIds((prev) => {
            if (!prev.has(item.id)) return prev;

            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }, ADD_TO_CART_CONFIRM_MS),
      );
    },
    [formatPrice, isMounted, onAddItem],
  );

  return { recentlyAddedIds, handleAddToCart };
}
