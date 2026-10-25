import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Calendar, Utensils, MapPin, PhoneCall, ShoppingBag, LayoutDashboard, Star, LogIn, Gift, Bell, Palette, Tag, TrendingUp, Trash2, type LucideIcon } from "lucide-react";
import { type ActionPayload, type ActionType, SIGNED_IN_ONLY_ACTIONS, ADMIN_ONLY_ACTIONS, DESTRUCTIVE_ACTIONS } from "@/types/action";
import { PREFILL_BOOKING, PREFILL_MENU, PREFILL_CHECKOUT, APPLY_COUPON, OPEN_CART, OPEN_NOTIFICATIONS, MUTE_ALL_NOTIFICATIONS, UNMUTE_ALL_NOTIFICATIONS, MUTE_NOTIFICATION_TYPE, UNMUTE_NOTIFICATION_TYPE, ENABLE_PUSH, DISABLE_PUSH, SET_THEME_MODE, SET_COLOR_PALETTE, OPEN_REWARD, ADMIN_UPDATE_ORDER_STATUS, ADMIN_TOGGLE_ORDER_PAID, ADMIN_UPDATE_RESERVATION_STATUS, ADMIN_TOGGLE_ITEM_ACTIVE, ADMIN_TOGGLE_ITEM_POPULAR, ADMIN_TOGGLE_BRANCH_ACTIVE, ADMIN_TOGGLE_COUPON_ACTIVE, ADMIN_UPDATE_GAME_REWARD, dispatchCafeEvent } from "@/lib/core/events";

const SECTION_IDS = { MENU: "menu", LOCATION: "location", BOOKINGS: "bookings", GAMES: "games-rewards" } as const;
const RESUME_ACTION_STORAGE_KEY = "cafe_resume_action";
const PENDING_PREFILL_STORAGE_KEY = "cafe_pending_prefill";
const HOME_PATH = "/";

export type ConfirmAction = (action: ActionPayload) => Promise<boolean>;

export interface DispatchContext {
  router: AppRouterInstance;
  onClose: () => void;
  userId: string | null;
  assistantType: "customer" | "admin";
  reducedMotion: boolean;
  requestConfirmation?: ConfirmAction;
}

export interface PendingPrefill {
  readonly actionType: ActionType;
  readonly data: unknown;
  readonly sectionId: string | null;
}

function exhaustiveCheck(action: never): void { void action; }

function deferScroll(getElement: () => HTMLElement | null, reducedMotion: boolean): void {
  if (typeof window === "undefined") return;
  const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
  requestAnimationFrame(() => { requestAnimationFrame(() => { getElement()?.scrollIntoView({ behavior }); }); });
}

function warnDev(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[chat/actions] ${message}`, detail);
}

function stashResumeAction(payload: { type: ActionType; data: unknown }): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(RESUME_ACTION_STORAGE_KEY, JSON.stringify(payload)); } catch {}
}

function stashPendingPrefill(payload: PendingPrefill): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(PENDING_PREFILL_STORAGE_KEY, JSON.stringify(payload)); } catch {}
}

function buildHomeHref(actionType: ActionType, sectionId: string | null, hasData: boolean): string {
  if (hasData) return `${HOME_PATH}?prefill=${encodeURIComponent(actionType)}`;
  if (sectionId) return `${HOME_PATH}?scrollTo=${encodeURIComponent(sectionId)}`;
  return HOME_PATH;
}

function hasSectionOnCurrentRoute(sectionId: string | null): boolean {
  if (typeof document === "undefined" || !sectionId) return false;
  return document.getElementById(sectionId) !== null;
}

function redirectToSignIn(router: AppRouterInstance): void {
  const redirectTo = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
  router.push(`/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`);
}

function dispatchSectionAction(ctx: DispatchContext, options: { sectionId: string | null; actionType: ActionType; dataForStash: unknown; onPresent: () => void; }): void {
  const { router, reducedMotion } = ctx;
  if (hasSectionOnCurrentRoute(options.sectionId)) {
    if (options.sectionId) deferScroll(() => document.getElementById(options.sectionId as string), reducedMotion);
    options.onPresent();
    return;
  }
  stashPendingPrefill({ actionType: options.actionType, data: options.dataForStash, sectionId: options.sectionId });
  const hasData = options.dataForStash !== undefined;
  router.push(buildHomeHref(options.actionType, options.sectionId, hasData));
}

export async function dispatchChatAction(action: ActionPayload, ctx: DispatchContext): Promise<void> {
  const { router, onClose, userId, assistantType, reducedMotion, requestConfirmation } = ctx;

  if (assistantType === "customer" && ADMIN_ONLY_ACTIONS.has(action.type)) {
    warnDev(`Refusing admin-only action "${action.type}" on customer surface.`, action);
    return;
  }

  if (assistantType === "customer" && !userId && SIGNED_IN_ONLY_ACTIONS.has(action.type)) {
    stashResumeAction({ type: action.type, data: action.data });
    onClose();
    redirectToSignIn(router);
    return;
  }

  if (DESTRUCTIVE_ACTIONS.has(action.type)) {
    if (!requestConfirmation) {
      warnDev(`Destructive action "${action.type}" refused: no confirmation handler supplied.`, action);
      return;
    }
    let confirmed = false;
    try { confirmed = await requestConfirmation(action); } catch (err) { warnDev("Confirmation handler threw; treating as cancelled.", err); confirmed = false; }
    if (!confirmed) return;
  }

  onClose();

  switch (action.type) {
    case "NAVIGATE_SECTION": {
      const targetId = action.data?.sectionId || SECTION_IDS.MENU;
      dispatchSectionAction(ctx, { sectionId: targetId, actionType: action.type, dataForStash: undefined, onPresent: () => {} });
      break;
    }
    case "FILTER_MENU": {
      dispatchSectionAction(ctx, { sectionId: SECTION_IDS.MENU, actionType: action.type, dataForStash: { category: action.data?.category, search: action.data?.search, maxPrice: action.data?.maxPrice }, onPresent: () => { dispatchCafeEvent(PREFILL_MENU, { category: action.data?.category, search: action.data?.search, maxPrice: action.data?.maxPrice }); } });
      break;
    }
    case "OPEN_DIRECTIONS": {
      dispatchSectionAction(ctx, { sectionId: SECTION_IDS.LOCATION, actionType: action.type, dataForStash: undefined, onPresent: () => {} });
      break;
    }
    case "OPEN_CONTACT": {
      const hasFooter = typeof document !== "undefined" && document.querySelector("footer") !== null;
      if (hasFooter) { deferScroll(() => document.querySelector("footer"), reducedMotion); break; }
      stashPendingPrefill({ actionType: action.type, data: undefined, sectionId: "contact" });
      router.push(buildHomeHref(action.type, "contact", false));
      break;
    }
    case "REQUIRE_SIGNIN": {
      if (action.data?.resumeAction) stashResumeAction({ type: action.data.resumeAction, data: action.data.resumeData });
      redirectToSignIn(router);
      break;
    }
    case "PREFILL_RESERVATION": {
      dispatchSectionAction(ctx, { sectionId: SECTION_IDS.BOOKINGS, actionType: action.type, dataForStash: action.data, onPresent: () => { if (action.data) dispatchCafeEvent(PREFILL_BOOKING, action.data); } });
      break;
    }
    case "CANCEL_BOOKING": {
      if (action.data?.bookingId) router.push(`/customer?tab=bookings&cancelBooking=${encodeURIComponent(action.data.bookingId)}`);
      break;
    }
    case "VIEW_RESERVATIONS": {
      router.push("/customer?tab=bookings");
      break;
    }
    case "ADD_TO_CART": {
      const items = [...(action.data?.items ?? [])];
      if (items.length === 0 && action.data?.itemId && action.data?.itemName) items.push({ itemId: action.data.itemId, itemName: action.data.itemName, itemPrice: action.data.itemPrice, quantity: action.data.quantity ?? 1 });
      dispatchSectionAction(ctx, { sectionId: SECTION_IDS.MENU, actionType: action.type, dataForStash: { itemsToAdd: items }, onPresent: () => { dispatchCafeEvent(PREFILL_MENU, { itemsToAdd: items }); } });
      break;
    }
    case "REMOVE_FROM_CART":
    case "UPDATE_CART_ITEM":
    case "CLEAR_CART": {
      dispatchCafeEvent(OPEN_CART, { type: action.type, itemId: action.data?.itemId, quantity: action.data?.quantity });
      break;
    }
    case "START_CHECKOUT": {
      dispatchCafeEvent(PREFILL_CHECKOUT, { orderType: action.data?.orderType, paymentMethod: action.data?.paymentMethod, name: action.data?.name, phone: action.data?.phone, address: action.data?.address });
      break;
    }
    case "APPLY_COUPON": {
      if (action.data?.code) dispatchCafeEvent(APPLY_COUPON, { code: action.data.code });
      break;
    }
    case "VIEW_ORDERS": {
      const tab = action.data?.tab === "history" ? "history" : "active";
      router.push(`/customer?tab=${tab}`);
      break;
    }
    case "RATE_ORDER": {
      if (action.data?.orderId) router.push(`/customer?tab=history&rateOrder=${encodeURIComponent(action.data.orderId)}`);
      break;
    }
    case "VIEW_FAVORITES": {
      router.push("/customer?tab=favorites");
      break;
    }
    case "ADD_TO_FAVORITES":
    case "REMOVE_FROM_FAVORITES": {
      // The dashboard performs the change when it opens (the same handshake as
      // ?cancelBooking=), so exactly one code path writes favorites.
      const itemId = action.data?.itemId;
      if (!itemId) {
        router.push("/customer?tab=favorites");
        break;
      }
      const param = action.type === "ADD_TO_FAVORITES" ? "addFavorite" : "removeFavorite";
      router.push(`/customer?tab=favorites&${param}=${encodeURIComponent(itemId)}`);
      break;
    }
    case "VIEW_COUPONS": {
      router.push("/customer?tab=coupons");
      break;
    }
    case "OPEN_REWARD": {
      dispatchSectionAction(ctx, { sectionId: SECTION_IDS.GAMES, actionType: action.type, dataForStash: undefined, onPresent: () => { dispatchCafeEvent(OPEN_REWARD); } });
      break;
    }
    case "OPEN_NOTIFICATIONS": dispatchCafeEvent(OPEN_NOTIFICATIONS); break;
    case "MUTE_ALL_NOTIFICATIONS": dispatchCafeEvent(MUTE_ALL_NOTIFICATIONS); break;
    case "UNMUTE_ALL_NOTIFICATIONS": dispatchCafeEvent(UNMUTE_ALL_NOTIFICATIONS); break;
    case "MUTE_NOTIFICATION_TYPE": { if (action.data?.type) dispatchCafeEvent(MUTE_NOTIFICATION_TYPE, { type: action.data.type }); break; }
    case "UNMUTE_NOTIFICATION_TYPE": { if (action.data?.type) dispatchCafeEvent(UNMUTE_NOTIFICATION_TYPE, { type: action.data.type }); break; }
    case "ENABLE_PUSH": dispatchCafeEvent(ENABLE_PUSH); break;
    case "DISABLE_PUSH": dispatchCafeEvent(DISABLE_PUSH); break;
    case "SET_THEME_MODE": { if (action.data?.mode) dispatchCafeEvent(SET_THEME_MODE, { mode: action.data.mode }); break; }
    case "SET_COLOR_PALETTE": { if (action.data?.palette) dispatchCafeEvent(SET_COLOR_PALETTE, { palette: action.data.palette }); break; }
    case "NAVIGATE_ADMIN": { router.push(`/admin?tab=${action.data?.tab ?? "orders"}`); break; }
    case "VIEW_REVENUE":
    case "VIEW_ORDER_STATS":
    case "VIEW_TOP_ITEMS": {
      const params = new URLSearchParams({ tab: "analytics", range: action.data?.range ?? "7d", metric: action.type === "VIEW_REVENUE" ? "revenue" : action.type === "VIEW_ORDER_STATS" ? "orders" : "top_items" });
      router.push(`/admin?${params.toString()}`);
      break;
    }
    case "UPDATE_ORDER_STATUS": { if (!action.data?.orderId || !action.data?.status) break; dispatchCafeEvent(ADMIN_UPDATE_ORDER_STATUS, { orderId: action.data.orderId, status: action.data.status }); router.push("/admin?tab=orders"); break; }
    case "TOGGLE_ORDER_PAID": { if (!action.data?.orderId || action.data?.isPaid === undefined) break; dispatchCafeEvent(ADMIN_TOGGLE_ORDER_PAID, { orderId: action.data.orderId, isPaid: action.data.isPaid }); router.push("/admin?tab=orders"); break; }
    case "UPDATE_RESERVATION_STATUS": { if (!action.data?.bookingId || !action.data?.status) break; dispatchCafeEvent(ADMIN_UPDATE_RESERVATION_STATUS, { bookingId: action.data.bookingId, status: action.data.status }); router.push("/admin?tab=reservations"); break; }
    case "TOGGLE_ITEM_ACTIVE": { if (!action.data?.id) break; dispatchCafeEvent(ADMIN_TOGGLE_ITEM_ACTIVE, { id: action.data.id }); router.push("/admin?tab=inventory"); break; }
    case "TOGGLE_ITEM_POPULAR": { if (!action.data?.id) break; dispatchCafeEvent(ADMIN_TOGGLE_ITEM_POPULAR, { id: action.data.id }); router.push("/admin?tab=inventory"); break; }
    case "TOGGLE_BRANCH_ACTIVE": { if (!action.data?.id) break; dispatchCafeEvent(ADMIN_TOGGLE_BRANCH_ACTIVE, { id: action.data.id }); router.push("/admin?tab=branches"); break; }
    case "TOGGLE_COUPON_ACTIVE": { if (!action.data?.id) break; dispatchCafeEvent(ADMIN_TOGGLE_COUPON_ACTIVE, { id: action.data.id }); router.push("/admin?tab=coupons"); break; }
    case "UPDATE_GAME_REWARD": { if (!action.data?.rewardKey) break; dispatchCafeEvent(ADMIN_UPDATE_GAME_REWARD, { rewardKey: action.data.rewardKey, title: action.data.title, promoCode: action.data.promoCode, discountValue: action.data.discountValue, description: action.data.description, isActive: action.data.isActive }); router.push("/admin?tab=coupons"); break; }
    default: exhaustiveCheck(action);
  }
}

export const ACTION_ICON: Partial<Record<ActionPayload["type"], LucideIcon>> = {
  NAVIGATE_SECTION: Utensils, FILTER_MENU: Utensils, OPEN_DIRECTIONS: MapPin, OPEN_CONTACT: PhoneCall, REQUIRE_SIGNIN: LogIn,
  PREFILL_RESERVATION: Calendar, CANCEL_BOOKING: Calendar, VIEW_RESERVATIONS: Calendar,
  ADD_TO_CART: ShoppingBag, REMOVE_FROM_CART: ShoppingBag, UPDATE_CART_ITEM: ShoppingBag, CLEAR_CART: Trash2, START_CHECKOUT: ShoppingBag, APPLY_COUPON: Tag,
  VIEW_ORDERS: ShoppingBag, RATE_ORDER: Star, VIEW_FAVORITES: Star, ADD_TO_FAVORITES: Star, REMOVE_FROM_FAVORITES: Star, VIEW_COUPONS: Tag, OPEN_REWARD: Gift,
  OPEN_NOTIFICATIONS: Bell, MUTE_ALL_NOTIFICATIONS: Bell, UNMUTE_ALL_NOTIFICATIONS: Bell, MUTE_NOTIFICATION_TYPE: Bell, UNMUTE_NOTIFICATION_TYPE: Bell, ENABLE_PUSH: Bell, DISABLE_PUSH: Bell,
  SET_THEME_MODE: Palette, SET_COLOR_PALETTE: Palette,
  NAVIGATE_ADMIN: LayoutDashboard, VIEW_REVENUE: TrendingUp, VIEW_ORDER_STATS: TrendingUp, VIEW_TOP_ITEMS: TrendingUp,
  TOGGLE_ITEM_ACTIVE: Tag, TOGGLE_ITEM_POPULAR: Tag, UPDATE_ORDER_STATUS: LayoutDashboard, TOGGLE_ORDER_PAID: LayoutDashboard, UPDATE_RESERVATION_STATUS: Calendar, TOGGLE_BRANCH_ACTIVE: MapPin, TOGGLE_COUPON_ACTIVE: Tag, UPDATE_GAME_REWARD: Gift,
};
