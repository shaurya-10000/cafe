import type { ToggleField } from "./types";

export const BANNER_TIMEOUT_MS = 5_000;

export const REALTIME_CHANNEL = "inventory-catalog-items";

/**
 * Delay before the AI-driven toggle fires, in milliseconds. The chat widget
 * routes to /admin?tab=inventory first, and this tab needs to be mounted and
 * populated with `products` before the handler can find the target item by
 * id. 400ms is enough on a warm client; on a cold one the product lookup
 * misses and surfaces a clear "item was not found" toast instead of silently
 * doing nothing.
 */
export const AI_ACTION_SETTLE_MS = 400;

/**
 * Currency prefix for the price shown in the list. The inventory list does
 * not receive the business currency yet; thread it through here when it does.
 */
export const PRICE_PREFIX = "$";

export const LOAD_ERROR_MESSAGE = "Couldn't load inventory. Refresh to try again.";

export const TOGGLE_COPY: Record<
  ToggleField,
  {
    on: (name: string) => string;
    off: (name: string) => string;
    fallbackError: string;
  }
> = {
  is_active: {
    on: (name) => `"${name}" is now visible to customers.`,
    off: (name) => `"${name}" is now hidden from customers.`,
    fallbackError: "Couldn't update item visibility.",
  },
  is_popular: {
    on: (name) => `"${name}" is now marked as popular.`,
    off: (name) => `"${name}" is no longer marked as popular.`,
    fallbackError: "Couldn't update item popularity.",
  },
};
