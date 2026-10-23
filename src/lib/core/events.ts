export const PREFILL_BOOKING = "cafe_prefill_booking" as const;
export const PREFILL_MENU = "cafe_prefill_menu" as const;
export const PREFILL_CHECKOUT = "cafe_prefill_checkout" as const;
export const APPLY_COUPON = "cafe_apply_coupon" as const;
export const OPEN_CART = "cafe_open_cart" as const;
export const CANCEL_BOOKING = "cafe_cancel_booking" as const;
export const OPEN_NOTIFICATIONS = "cafe_open_notifications" as const;
export const MUTE_ALL_NOTIFICATIONS = "cafe_mute_all_notifications" as const;
export const UNMUTE_ALL_NOTIFICATIONS = "cafe_unmute_all_notifications" as const;
export const MUTE_NOTIFICATION_TYPE = "cafe_mute_notification_type" as const;
export const UNMUTE_NOTIFICATION_TYPE = "cafe_unmute_notification_type" as const;
export const ENABLE_PUSH = "cafe_enable_push" as const;
export const DISABLE_PUSH = "cafe_disable_push" as const;
export const SET_THEME_MODE = "cafe_set_theme_mode" as const;
export const SET_COLOR_PALETTE = "cafe_set_color_palette" as const;
export const OPEN_REWARD = "cafe_open_reward" as const;

export const ADMIN_UPDATE_ORDER_STATUS = "cafe_admin_update_order_status" as const;
export const ADMIN_TOGGLE_ORDER_PAID = "cafe_admin_toggle_order_paid" as const;
export const ADMIN_UPDATE_RESERVATION_STATUS = "cafe_admin_update_reservation_status" as const;
export const ADMIN_TOGGLE_ITEM_ACTIVE = "cafe_admin_toggle_item_active" as const;
export const ADMIN_TOGGLE_ITEM_POPULAR = "cafe_admin_toggle_item_popular" as const;
export const ADMIN_TOGGLE_BRANCH_ACTIVE = "cafe_admin_toggle_branch_active" as const;
export const ADMIN_TOGGLE_COUPON_ACTIVE = "cafe_admin_toggle_coupon_active" as const;
export const ADMIN_UPDATE_GAME_REWARD = "cafe_admin_update_game_reward" as const;

export type CafeEventName =
  | typeof PREFILL_BOOKING
  | typeof PREFILL_MENU
  | typeof PREFILL_CHECKOUT
  | typeof APPLY_COUPON
  | typeof OPEN_CART
  | typeof CANCEL_BOOKING
  | typeof OPEN_NOTIFICATIONS
  | typeof MUTE_ALL_NOTIFICATIONS
  | typeof UNMUTE_ALL_NOTIFICATIONS
  | typeof MUTE_NOTIFICATION_TYPE
  | typeof UNMUTE_NOTIFICATION_TYPE
  | typeof ENABLE_PUSH
  | typeof DISABLE_PUSH
  | typeof SET_THEME_MODE
  | typeof SET_COLOR_PALETTE
  | typeof OPEN_REWARD
  | typeof ADMIN_UPDATE_ORDER_STATUS
  | typeof ADMIN_TOGGLE_ORDER_PAID
  | typeof ADMIN_UPDATE_RESERVATION_STATUS
  | typeof ADMIN_TOGGLE_ITEM_ACTIVE
  | typeof ADMIN_TOGGLE_ITEM_POPULAR
  | typeof ADMIN_TOGGLE_BRANCH_ACTIVE
  | typeof ADMIN_TOGGLE_COUPON_ACTIVE
  | typeof ADMIN_UPDATE_GAME_REWARD;

export const ALL_CAFE_EVENTS: Readonly<Record<string, CafeEventName>> =
  Object.freeze({
    PREFILL_BOOKING,
    PREFILL_MENU,
    PREFILL_CHECKOUT,
    APPLY_COUPON,
    OPEN_CART,
    CANCEL_BOOKING,
    OPEN_NOTIFICATIONS,
    MUTE_ALL_NOTIFICATIONS,
    UNMUTE_ALL_NOTIFICATIONS,
    MUTE_NOTIFICATION_TYPE,
    UNMUTE_NOTIFICATION_TYPE,
    ENABLE_PUSH,
    DISABLE_PUSH,
    SET_THEME_MODE,
    SET_COLOR_PALETTE,
    OPEN_REWARD,
    ADMIN_UPDATE_ORDER_STATUS,
    ADMIN_TOGGLE_ORDER_PAID,
    ADMIN_UPDATE_RESERVATION_STATUS,
    ADMIN_TOGGLE_ITEM_ACTIVE,
    ADMIN_TOGGLE_ITEM_POPULAR,
    ADMIN_TOGGLE_BRANCH_ACTIVE,
    ADMIN_TOGGLE_COUPON_ACTIVE,
    ADMIN_UPDATE_GAME_REWARD,
  });

export function dispatchCafeEvent<D>(
  name: CafeEventName,
  detail?: D
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    detail === undefined
      ? new CustomEvent(name)
      : new CustomEvent<D>(name, { detail })
  );
}

export function listenCafeEvent<D>(
  name: CafeEventName,
  handler: (event: CustomEvent<D>) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const wrapped = (event: Event) => handler(event as CustomEvent<D>);
  window.addEventListener(name, wrapped);
  return () => window.removeEventListener(name, wrapped);
}
