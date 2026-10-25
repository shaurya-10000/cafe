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
  readonly items?: unknown;
}

interface Target {
  readonly itemId: string | undefined;
  readonly itemName: string | undefined;
  /** NaN when the action carried no usable number. */
  readonly quantity: number;
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

/** One target per entry of `items`, or a single target from the top-level fields. */
function readTargets(detail: CartEventDetail): Target[] {
  const entries: unknown[] =
    Array.isArray(detail.items) && detail.items.length > 0
      ? detail.items
      : [detail];

  const targets: Target[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    targets.push({
      itemId: asText(record.itemId),
      itemName: asText(record.itemName),
      quantity: asQuantity(record.quantity),
    });
  }
  return targets;
}

async function handleCartEvent(
  detail: CartEventDetail | undefined,
  options: UseAiCartEventsOptions,
): Promise<void> {
  const type = detail?.type;
  if (
    !detail ||
    (type !== "REMOVE_FROM_CART" &&
      type !== "UPDATE_CART_ITEM" &&
      type !== "CLEAR_CART")
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

  const targets = readTargets(detail);
  if (targets.length === 0) {
    toast.error("I couldn't tell which item you meant.");
    openCart();
    return;
  }

  // Quantities as they stand after each step, so two entries for the same
  // item (or a remove after an update) work from current numbers, not stale ones.
  const working = new Map(items.map((item) => [item.id, item.quantity]));
  const done: string[] = [];
  const problems: string[] = [];

  for (const target of targets) {
    const line = findCartLine(items, target.itemId, target.itemName);
    const current = line ? working.get(line.id) : undefined;

    if (!line || current === undefined) {
      problems.push(`${target.itemName ?? "That item"} isn't in your cart`);
      continue;
    }

    if (type === "REMOVE_FROM_CART") {
      // A number means "take this many out"; no number means "remove the item".
      // The subtraction happens here because only the client knows the cart.
      const removeCount =
        Number.isFinite(target.quantity) && target.quantity > 0
          ? Math.max(1, Math.trunc(target.quantity))
          : null;

      if (removeCount === null || removeCount >= current) {
        await onRemoveAll(line.id);
        working.delete(line.id);
        done.push(`Removed ${line.name}`);
      } else {
        const remaining = current - removeCount;
        await onSetQuantity(line.id, remaining, current);
        working.set(line.id, remaining);
        done.push(`${line.name} -${removeCount} (${remaining} left)`);
      }
      continue;
    }

    // UPDATE_CART_ITEM sets an exact total.
    if (!Number.isFinite(target.quantity)) {
      problems.push(`No quantity given for ${line.name}`);
      continue;
    }

    if (target.quantity <= 0) {
      await onRemoveAll(line.id);
      working.delete(line.id);
      done.push(`Removed ${line.name}`);
      continue;
    }

    const next = Math.min(
      CART_ITEM_MAX_QUANTITY,
      Math.max(1, Math.trunc(target.quantity)),
    );
    if (next === current) {
      done.push(`${line.name} is already ${next}`);
      continue;
    }

    await onSetQuantity(line.id, next, current);
    working.set(line.id, next);
    done.push(`${line.name} set to ${next}`);
  }

  if (done.length === 1) {
    toast.success(done[0]);
  } else if (done.length > 1) {
    toast.success("Cart updated", { description: done.join(" \u00b7 ") });
  }
  if (problems.length > 0) toast.error(problems.join(" \u00b7 "));

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
