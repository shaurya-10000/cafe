"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { listenCafeEvent, OPEN_CART } from "@/lib/core/events";
import { CART_ITEM_MAX_QUANTITY, type CartItem } from "@/lib/domain/cart";

import { findCartLine } from "../lib/findCartLine";

interface CartEventDetail {
  readonly type?: unknown;
  readonly itemId?: unknown;
  readonly itemName?: unknown;
  readonly quantity?: unknown;
}

interface UseAiCartEventsOptions {
  readonly items: readonly CartItem[];
  readonly onRemoveAll: (id: string) => Promise<void>;
  readonly onSetQuantity: (
    id: string,
    quantity: number,
    previousQuantity: number,
  ) => Promise<void>;
  readonly onClear: () => Promise<void>;
  readonly openCart: () => void;
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asQuantity(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

async function handleCartEvent(
  detail: CartEventDetail | undefined,
  options: UseAiCartEventsOptions,
): Promise<void> {
  const type = detail?.type;
  if (
    type !== "REMOVE_FROM_CART" &&
    type !== "UPDATE_CART_ITEM" &&
    type !== "CLEAR_CART"
  ) {
    return;
  }

  const { items, onRemoveAll, onSetQuantity, onClear, openCart } = options;

  if (type === "CLEAR_CART") {
    if (items.length === 0) {
      toast.info("Your cart is already empty.");
      return;
    }
    await onClear();
    toast.success("Cart cleared");
    return;
  }

  const line = findCartLine(
    items,
    asText(detail?.itemId),
    asText(detail?.itemName),
  );
  if (!line) {
    toast.error("That item isn't in your cart.");
    openCart();
    return;
  }

  const quantity = asQuantity(detail?.quantity);

  if (type === "REMOVE_FROM_CART") {
    // A number means "take this many out"; no number means "remove the item".
    // The subtraction happens here because only the client knows the cart.
    const removeCount =
      Number.isFinite(quantity) && quantity > 0
        ? Math.max(1, Math.trunc(quantity))
        : null;

    if (removeCount === null || removeCount >= line.quantity) {
      await onRemoveAll(line.id);
      toast.success(`Removed ${line.name} from your cart`);
      openCart();
      return;
    }

    const remaining = line.quantity - removeCount;
    await onSetQuantity(line.id, remaining, line.quantity);
    toast.success(`Removed ${removeCount} ${line.name} (${remaining} left)`);
    openCart();
    return;
  }

  // UPDATE_CART_ITEM sets an exact total.
  if (Number.isFinite(quantity) && quantity <= 0) {
    await onRemoveAll(line.id);
    toast.success(`Removed ${line.name} from your cart`);
    openCart();
    return;
  }

  if (!Number.isFinite(quantity)) {
    toast.error("I couldn't tell what quantity you wanted.");
    openCart();
    return;
  }

  const target = Math.min(CART_ITEM_MAX_QUANTITY, Math.trunc(quantity));
  await onSetQuantity(line.id, target, line.quantity);
  toast.success(`Updated ${line.name} to ${target}`);
  openCart();
}

/**
 * Performs the AI concierge's remove / update / clear cart actions. The chat
 * dispatches them on the OPEN_CART event; each one goes through the same
 * handlers the sidebar's own buttons use, so there is one cart-writing path.
 */
export function useAiCartEvents(options: UseAiCartEventsOptions): void {
  const latestRef = useRef(options);

  useEffect(() => {
    latestRef.current = options;
  });

  useEffect(() => {
    return listenCafeEvent<CartEventDetail>(OPEN_CART, (event) => {
      handleCartEvent(event.detail, latestRef.current).catch((error: unknown) => {
        console.error("[cart] AI cart action failed", error);
        toast.error("Couldn't update your cart. Please try again.");
      });
    });
  }, []);
}
