import { z } from "zod";
import {
  SLOT_FILL_ACTIONS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/ai/constants";
import type { ActionPayload } from "./core";

const NonEmptyLabel = z.string().trim().min(1).max(160);
const UuidishString = z.string().trim().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Expected a UUID.");
const ShortIdString = z.string().trim().min(1).max(120);
const QuantityInt = z.number().int().min(1).max(100);
const PriceNumber = z.number().finite().min(0).max(1_000_000);
const BooleanStrict = z.boolean();

const NavigationDataSchema = z.object({ sectionId: ShortIdString.optional() });
const MenuFilterDataSchema = z.object({
  category: z.string().trim().max(80).optional(),
  maxPrice: PriceNumber.optional(),
  dietary: z.array(z.string().trim().max(40)).max(10).optional(),
  search: z.string().trim().max(200).optional(),
});
const ReservationDataSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD.").optional(),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, "Expected HH:MM.").optional(),
  partySize: z.number().int().min(1).max(100).optional(),
  locationId: UuidishString.optional(),
  guests: z.number().int().min(1).max(100).optional(),
  branchId: UuidishString.optional(),
  branchName: z.string().trim().max(160).optional(),
});
const ReservationActionDataSchema = z.object({ bookingId: UuidishString.optional() });
const CartLineItemSchema = z.object({
  itemId: UuidishString.optional().catch(undefined),
  itemName: z.string().trim().max(200).optional(),
  itemPrice: PriceNumber.optional(),
  quantity: QuantityInt.optional(),
});
const CartDataSchema = z.object({
  items: z.array(CartLineItemSchema).max(50).optional(),
  itemId: UuidishString.optional().catch(undefined),
  itemName: z.string().trim().max(200).optional(),
  itemPrice: PriceNumber.optional(),
  quantity: QuantityInt.optional(),
});
const CartMutationDataSchema = z.object({
  items: z.array(CartLineItemSchema).max(50).optional(),
  itemId: UuidishString.optional().catch(undefined),
  itemName: z.string().trim().max(200).optional(),
  quantity: QuantityInt.optional(),
});
const CheckoutDataSchema = z.object({
  orderType: z.enum(["delivery", "pickup"]).optional(),
  paymentMethod: z.enum(["online", "in_person"]).optional(),
  name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
});
const CouponApplyDataSchema = z.object({ code: z.string().trim().min(1).max(64).optional() });
const OrdersDataSchema = z.object({ tab: z.enum(["active", "history"]).optional() });
const RateOrderDataSchema = z.object({ orderId: UuidishString.optional() });
const FavoriteDataSchema = z.object({
  itemId: UuidishString.optional(),
  itemName: z.string().trim().max(200).optional(),
});
const RewardDataSchema = z.object({ rewardKey: ShortIdString.optional() });
const NotificationPreferencesDataSchema = z.object({ type: z.string().trim().min(1).max(80).optional() });
const ThemeModeDataSchema = z.object({ mode: z.string().trim().toLowerCase().pipe(z.enum(["light", "dark", "system"])).optional() });
const ColorPaletteDataSchema = z.object({
  palette: z.string().trim().toLowerCase().pipe(z.enum(["espresso", "emerald", "rosewood", "champagne"])).optional(),
});

export const ACTION_TYPE_NAMES = [
  "NAVIGATE_SECTION", "FILTER_MENU", "OPEN_DIRECTIONS", "OPEN_CONTACT", "REQUIRE_SIGNIN",
  "PREFILL_RESERVATION", "CANCEL_BOOKING", "VIEW_RESERVATIONS",
  "ADD_TO_CART", "REMOVE_FROM_CART", "UPDATE_CART_ITEM", "CLEAR_CART", "START_CHECKOUT", "APPLY_COUPON",
  "VIEW_ORDERS", "RATE_ORDER", "VIEW_FAVORITES", "ADD_TO_FAVORITES", "REMOVE_FROM_FAVORITES", "VIEW_COUPONS", "OPEN_REWARD",
  "OPEN_NOTIFICATIONS", "MUTE_ALL_NOTIFICATIONS", "UNMUTE_ALL_NOTIFICATIONS", "MUTE_NOTIFICATION_TYPE", "UNMUTE_NOTIFICATION_TYPE", "ENABLE_PUSH", "DISABLE_PUSH",
  "SET_THEME_MODE", "SET_COLOR_PALETTE",
  "NAVIGATE_ADMIN", "VIEW_REVENUE", "VIEW_ORDER_STATS", "VIEW_TOP_ITEMS",
  "TOGGLE_ITEM_ACTIVE", "TOGGLE_ITEM_POPULAR", "UPDATE_ORDER_STATUS", "TOGGLE_ORDER_PAID", "UPDATE_RESERVATION_STATUS", "TOGGLE_BRANCH_ACTIVE", "TOGGLE_COUPON_ACTIVE", "UPDATE_GAME_REWARD",
] as const satisfies readonly ActionPayload["type"][];

export type ActionType = ActionPayload["type"];

export const SLOT_FILL_ACTION_TYPES = Object.keys(
  SLOT_FILL_ACTIONS,
) as readonly ActionType[] satisfies readonly ActionType[];

const SigninGateDataSchema = z.object({
  resumeAction: z.enum(ACTION_TYPE_NAMES).optional(),
  resumeData: z.object({
    date: ReservationDataSchema.shape.date, time: ReservationDataSchema.shape.time,
    partySize: ReservationDataSchema.shape.partySize, locationId: ReservationDataSchema.shape.locationId,
    guests: ReservationDataSchema.shape.guests, branchId: ReservationDataSchema.shape.branchId,
    branchName: ReservationDataSchema.shape.branchName, items: CartDataSchema.shape.items,
    itemId: CartDataSchema.shape.itemId, itemName: CartDataSchema.shape.itemName,
    itemPrice: CartDataSchema.shape.itemPrice, quantity: CartDataSchema.shape.quantity,
    orderType: CheckoutDataSchema.shape.orderType, paymentMethod: CheckoutDataSchema.shape.paymentMethod,
    name: CheckoutDataSchema.shape.name, phone: CheckoutDataSchema.shape.phone, address: CheckoutDataSchema.shape.address,
  }).optional(),
});

const AdminNavDataSchema = z.object({
  tab: z.enum(["orders", "reservations", "inventory", "branches", "analytics", "coupons"]).optional(),
});
const AnalyticsQueryDataSchema = z.object({
  range: z.enum(["today", "7d", "30d", "90d", "all"]).optional(),
  metric: z.enum(["revenue", "orders", "aov", "top_items", "bottom_items"]).optional(),
});
const AdminStatusDataSchema = z.object({
  orderId: UuidishString.optional(),
  status: z.enum(ORDER_STATUSES as unknown as readonly [OrderStatus, ...OrderStatus[]]).optional(),
});
const ReservationStatusDataSchema = z.object({
  bookingId: UuidishString.optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
});
const OrderPaidToggleDataSchema = z.object({
  orderId: UuidishString.optional(), isPaid: BooleanStrict.optional(),
});
const AdminEntityToggleDataSchema = z.object({ id: UuidishString.optional() });
const GameRewardAdminDataSchema = z.object({
  rewardKey: ShortIdString.optional(), title: z.string().trim().max(200).optional(),
  promoCode: z.string().trim().max(64).optional(), discountValue: z.string().trim().max(64).optional(),
  description: z.string().trim().max(1000).optional(), isActive: BooleanStrict.optional(),
});

const EmptyDataSchema = z.object({}).passthrough();

export const ActionPayloadSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("NAVIGATE_SECTION"), label: NonEmptyLabel, data: NavigationDataSchema.optional() }).strict(),
    z.object({ type: z.literal("FILTER_MENU"), label: NonEmptyLabel, data: MenuFilterDataSchema.optional() }).strict(),
    z.object({ type: z.literal("OPEN_DIRECTIONS"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("OPEN_CONTACT"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("REQUIRE_SIGNIN"), label: NonEmptyLabel, data: SigninGateDataSchema.optional() }).strict(),
    z.object({ type: z.literal("PREFILL_RESERVATION"), label: NonEmptyLabel, data: ReservationDataSchema.optional() }).strict(),
    z.object({ type: z.literal("CANCEL_BOOKING"), label: NonEmptyLabel, data: ReservationActionDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_RESERVATIONS"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("ADD_TO_CART"), label: NonEmptyLabel, data: CartDataSchema.optional() }).strict(),
    z.object({ type: z.literal("REMOVE_FROM_CART"), label: NonEmptyLabel, data: CartMutationDataSchema.optional() }).strict(),
    z.object({ type: z.literal("UPDATE_CART_ITEM"), label: NonEmptyLabel, data: CartMutationDataSchema.optional() }).strict(),
    z.object({ type: z.literal("CLEAR_CART"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("START_CHECKOUT"), label: NonEmptyLabel, data: CheckoutDataSchema.optional() }).strict(),
    z.object({ type: z.literal("APPLY_COUPON"), label: NonEmptyLabel, data: CouponApplyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_ORDERS"), label: NonEmptyLabel, data: OrdersDataSchema.optional() }).strict(),
    z.object({ type: z.literal("RATE_ORDER"), label: NonEmptyLabel, data: RateOrderDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_FAVORITES"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("ADD_TO_FAVORITES"), label: NonEmptyLabel, data: FavoriteDataSchema.optional() }).strict(),
    z.object({ type: z.literal("REMOVE_FROM_FAVORITES"), label: NonEmptyLabel, data: FavoriteDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_COUPONS"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("OPEN_REWARD"), label: NonEmptyLabel, data: RewardDataSchema.optional() }).strict(),
    z.object({ type: z.literal("OPEN_NOTIFICATIONS"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("MUTE_ALL_NOTIFICATIONS"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("UNMUTE_ALL_NOTIFICATIONS"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("MUTE_NOTIFICATION_TYPE"), label: NonEmptyLabel, data: NotificationPreferencesDataSchema.optional() }).strict(),
    z.object({ type: z.literal("UNMUTE_NOTIFICATION_TYPE"), label: NonEmptyLabel, data: NotificationPreferencesDataSchema.optional() }).strict(),
    z.object({ type: z.literal("ENABLE_PUSH"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("DISABLE_PUSH"), label: NonEmptyLabel, data: EmptyDataSchema.optional() }).strict(),
    z.object({ type: z.literal("SET_THEME_MODE"), label: NonEmptyLabel, data: ThemeModeDataSchema.optional() }).strict(),
    z.object({ type: z.literal("SET_COLOR_PALETTE"), label: NonEmptyLabel, data: ColorPaletteDataSchema.optional() }).strict(),
    z.object({ type: z.literal("NAVIGATE_ADMIN"), label: NonEmptyLabel, data: AdminNavDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_REVENUE"), label: NonEmptyLabel, data: AnalyticsQueryDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_ORDER_STATS"), label: NonEmptyLabel, data: AnalyticsQueryDataSchema.optional() }).strict(),
    z.object({ type: z.literal("VIEW_TOP_ITEMS"), label: NonEmptyLabel, data: AnalyticsQueryDataSchema.optional() }).strict(),
    z.object({ type: z.literal("TOGGLE_ITEM_ACTIVE"), label: NonEmptyLabel, data: AdminEntityToggleDataSchema.optional() }).strict(),
    z.object({ type: z.literal("TOGGLE_ITEM_POPULAR"), label: NonEmptyLabel, data: AdminEntityToggleDataSchema.optional() }).strict(),
    z.object({ type: z.literal("UPDATE_ORDER_STATUS"), label: NonEmptyLabel, data: AdminStatusDataSchema.optional() }).strict(),
    z.object({ type: z.literal("TOGGLE_ORDER_PAID"), label: NonEmptyLabel, data: OrderPaidToggleDataSchema.optional() }).strict(),
    z.object({ type: z.literal("UPDATE_RESERVATION_STATUS"), label: NonEmptyLabel, data: ReservationStatusDataSchema.optional() }).strict(),
    z.object({ type: z.literal("TOGGLE_BRANCH_ACTIVE"), label: NonEmptyLabel, data: AdminEntityToggleDataSchema.optional() }).strict(),
    z.object({ type: z.literal("TOGGLE_COUPON_ACTIVE"), label: NonEmptyLabel, data: AdminEntityToggleDataSchema.optional() }).strict(),
    z.object({ type: z.literal("UPDATE_GAME_REWARD"), label: NonEmptyLabel, data: GameRewardAdminDataSchema.optional() }).strict(),
  ])
  .transform((value) => value as ActionPayload);

type _SchemaOutputMatchesUnion =
  z.infer<typeof ActionPayloadSchema> extends ActionPayload
    ? ActionPayload extends z.infer<typeof ActionPayloadSchema> ? true : { __error: "ActionPayloadSchema output is missing members of ActionPayload"; }
    : { __error: "ActionPayloadSchema output is not assignable to ActionPayload"; };

type _AssertSchemaMatchesUnion = _SchemaOutputMatchesUnion extends true ? true : never;

export const SIGNED_IN_ONLY_ACTIONS: ReadonlySet<ActionType> = new Set<ActionType>([
  "PREFILL_RESERVATION", "CANCEL_BOOKING", "VIEW_RESERVATIONS", "ADD_TO_CART", "REMOVE_FROM_CART", "UPDATE_CART_ITEM",
  "CLEAR_CART", "START_CHECKOUT", "APPLY_COUPON", "VIEW_ORDERS", "RATE_ORDER", "VIEW_FAVORITES", "ADD_TO_FAVORITES",
  "REMOVE_FROM_FAVORITES", "VIEW_COUPONS", "OPEN_REWARD", "MUTE_ALL_NOTIFICATIONS", "UNMUTE_ALL_NOTIFICATIONS",
  "MUTE_NOTIFICATION_TYPE", "UNMUTE_NOTIFICATION_TYPE", "ENABLE_PUSH", "DISABLE_PUSH", "SET_THEME_MODE", "SET_COLOR_PALETTE",
]);

export const ADMIN_ONLY_ACTIONS: ReadonlySet<ActionType> = new Set<ActionType>([
  "NAVIGATE_ADMIN", "VIEW_REVENUE", "VIEW_ORDER_STATS", "VIEW_TOP_ITEMS", "TOGGLE_ITEM_ACTIVE", "TOGGLE_ITEM_POPULAR",
  "UPDATE_ORDER_STATUS", "TOGGLE_ORDER_PAID", "UPDATE_RESERVATION_STATUS", "TOGGLE_BRANCH_ACTIVE", "TOGGLE_COUPON_ACTIVE", "UPDATE_GAME_REWARD",
]);

export const DESTRUCTIVE_ACTIONS: ReadonlySet<ActionType> = new Set<ActionType>([
  "UPDATE_ORDER_STATUS", "UPDATE_RESERVATION_STATUS", "TOGGLE_ORDER_PAID", "TOGGLE_ITEM_ACTIVE", "TOGGLE_BRANCH_ACTIVE",
  "TOGGLE_COUPON_ACTIVE", "UPDATE_GAME_REWARD", "CLEAR_CART",
]);
