export type AdminTab = "orders" | "reservations" | "inventory" | "branches" | "analytics" | "coupons";
export interface AdminNavData { tab?: AdminTab; }
export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "all";
export interface AnalyticsQueryData {
  range?: AnalyticsRange;
  metric?: "revenue" | "orders" | "aov" | "top_items" | "bottom_items";
}
export interface AdminStatusData { orderId?: string; status?: string; }
export interface ReservationStatusData { bookingId?: string; status?: string; }
export interface OrderPaidToggleData { orderId?: string; isPaid?: boolean; }
export interface AdminEntityToggleData { id?: string; }
export interface GameRewardAdminData {
  rewardKey?: string; title?: string; promoCode?: string;
  discountValue?: string; description?: string; isActive?: boolean;
}

export type AdminAction =
  | { type: "NAVIGATE_ADMIN"; label: string; data?: AdminNavData }
  | { type: "VIEW_REVENUE"; label: string; data?: AnalyticsQueryData }
  | { type: "VIEW_ORDER_STATS"; label: string; data?: AnalyticsQueryData }
  | { type: "VIEW_TOP_ITEMS"; label: string; data?: AnalyticsQueryData }
  | { type: "TOGGLE_ITEM_ACTIVE"; label: string; data?: AdminEntityToggleData }
  | { type: "TOGGLE_ITEM_POPULAR"; label: string; data?: AdminEntityToggleData }
  | { type: "UPDATE_ORDER_STATUS"; label: string; data?: AdminStatusData }
  | { type: "TOGGLE_ORDER_PAID"; label: string; data?: OrderPaidToggleData }
  | { type: "UPDATE_RESERVATION_STATUS"; label: string; data?: ReservationStatusData }
  | { type: "TOGGLE_BRANCH_ACTIVE"; label: string; data?: AdminEntityToggleData }
  | { type: "TOGGLE_COUPON_ACTIVE"; label: string; data?: AdminEntityToggleData }
  | { type: "UPDATE_GAME_REWARD"; label: string; data?: GameRewardAdminData };
