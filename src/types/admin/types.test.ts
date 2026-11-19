import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  AdminAction,
  AdminEntityToggleData,
  AdminNavData,
  AdminStatusData,
  AdminTab,
  AnalyticsQueryData,
  AnalyticsRange,
  GameRewardAdminData,
  OrderPaidToggleData,
  ReservationStatusData,
} from "./types";

type ActionType = AdminAction["type"];
type ActionOf<T extends ActionType> = Extract<AdminAction, { type: T }>;

// Compile-time exhaustiveness: adding an action to the union without
// updating this switch fails the type-check.
function assertNever(value: never): never {
  throw new Error(`Unhandled admin action: ${JSON.stringify(value)}`);
}

function groupOf(action: AdminAction): string {
  switch (action.type) {
    case "NAVIGATE_ADMIN":
      return "nav";
    case "VIEW_REVENUE":
    case "VIEW_ORDER_STATS":
    case "VIEW_TOP_ITEMS":
      return "analytics";
    case "TOGGLE_ITEM_ACTIVE":
    case "TOGGLE_ITEM_POPULAR":
    case "TOGGLE_BRANCH_ACTIVE":
    case "TOGGLE_COUPON_ACTIVE":
      return "entity-toggle";
    case "UPDATE_ORDER_STATUS":
      return "order-status";
    case "TOGGLE_ORDER_PAID":
      return "order-paid";
    case "UPDATE_RESERVATION_STATUS":
      return "reservation-status";
    case "UPDATE_GAME_REWARD":
      return "game-reward";
    default:
      return assertNever(action);
  }
}

// Compile-time exhaustiveness for the tab and range unions.
const TAB_LABELS: Record<AdminTab, string> = {
  orders: "Orders",
  reservations: "Reservations",
  inventory: "Inventory",
  branches: "Branches",
  analytics: "Analytics",
  coupons: "Coupons",
};

const RANGE_DAYS: Record<AnalyticsRange, number | null> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

// Used only for compile-time checks of invalid literals below.
function accept(_action: AdminAction): void {}

describe("admin types - unions", () => {
  it("restricts AdminTab to the six admin tabs", () => {
    expectTypeOf<AdminTab>().toEqualTypeOf<
      "orders" | "reservations" | "inventory" | "branches" | "analytics" | "coupons"
    >();
    expect(Object.keys(TAB_LABELS)).toHaveLength(6);
  });

  it("restricts AnalyticsRange to the five ranges", () => {
    expectTypeOf<AnalyticsRange>().toEqualTypeOf<"today" | "7d" | "30d" | "90d" | "all">();
    expect(Object.keys(RANGE_DAYS)).toHaveLength(5);
  });
});

describe("admin types - payloads", () => {
  it("types AdminNavData with an optional tab", () => {
    expectTypeOf<AdminNavData>().toEqualTypeOf<{ tab?: AdminTab }>();

    const empty: AdminNavData = {};
    expect(empty).toEqual({});
  });

  it("types AnalyticsQueryData with optional range and metric", () => {
    expectTypeOf<AnalyticsQueryData["range"]>().toEqualTypeOf<AnalyticsRange | undefined>();
    expectTypeOf<AnalyticsQueryData["metric"]>().toEqualTypeOf<
      "revenue" | "orders" | "aov" | "top_items" | "bottom_items" | undefined
    >();

    const full: AnalyticsQueryData = { range: "30d", metric: "top_items" };
    expect(full.range).toBe("30d");
  });

  it("defines the status payloads with string statuses", () => {
    expectTypeOf<AdminStatusData>().toEqualTypeOf<{ orderId?: string; status?: string }>();
    expectTypeOf<ReservationStatusData>().toEqualTypeOf<{
      bookingId?: string;
      status?: string;
    }>();
  });

  it("defines the toggle payloads", () => {
    expectTypeOf<OrderPaidToggleData>().toEqualTypeOf<{ orderId?: string; isPaid?: boolean }>();
    expectTypeOf<AdminEntityToggleData>().toEqualTypeOf<{ id?: string }>();
  });

  it("defines the exact GameRewardAdminData shape with every field optional", () => {
    expectTypeOf<GameRewardAdminData>().toEqualTypeOf<{
      rewardKey?: string;
      title?: string;
      promoCode?: string;
      discountValue?: string;
      description?: string;
      isActive?: boolean;
    }>();

    const empty: GameRewardAdminData = {};
    expect(empty).toEqual({});
  });
});

describe("admin types - AdminAction union", () => {
  it("contains exactly the twelve action types", () => {
    expectTypeOf<ActionType>().toEqualTypeOf<
      | "NAVIGATE_ADMIN"
      | "VIEW_REVENUE"
      | "VIEW_ORDER_STATS"
      | "VIEW_TOP_ITEMS"
      | "TOGGLE_ITEM_ACTIVE"
      | "TOGGLE_ITEM_POPULAR"
      | "UPDATE_ORDER_STATUS"
      | "TOGGLE_ORDER_PAID"
      | "UPDATE_RESERVATION_STATUS"
      | "TOGGLE_BRANCH_ACTIVE"
      | "TOGGLE_COUPON_ACTIVE"
      | "UPDATE_GAME_REWARD"
    >();
  });

  it("requires a string label on every action", () => {
    expectTypeOf<AdminAction["label"]>().toEqualTypeOf<string>();
  });

  it("pairs each action with the right optional payload", () => {
    expectTypeOf<ActionOf<"NAVIGATE_ADMIN">["data"]>().toEqualTypeOf<AdminNavData | undefined>();

    expectTypeOf<ActionOf<"VIEW_REVENUE">["data"]>().toEqualTypeOf<AnalyticsQueryData | undefined>();
    expectTypeOf<ActionOf<"VIEW_ORDER_STATS">["data"]>().toEqualTypeOf<AnalyticsQueryData | undefined>();
    expectTypeOf<ActionOf<"VIEW_TOP_ITEMS">["data"]>().toEqualTypeOf<AnalyticsQueryData | undefined>();

    expectTypeOf<ActionOf<"TOGGLE_ITEM_ACTIVE">["data"]>().toEqualTypeOf<AdminEntityToggleData | undefined>();
    expectTypeOf<ActionOf<"TOGGLE_ITEM_POPULAR">["data"]>().toEqualTypeOf<AdminEntityToggleData | undefined>();
    expectTypeOf<ActionOf<"TOGGLE_BRANCH_ACTIVE">["data"]>().toEqualTypeOf<AdminEntityToggleData | undefined>();
    expectTypeOf<ActionOf<"TOGGLE_COUPON_ACTIVE">["data"]>().toEqualTypeOf<AdminEntityToggleData | undefined>();

    expectTypeOf<ActionOf<"UPDATE_ORDER_STATUS">["data"]>().toEqualTypeOf<AdminStatusData | undefined>();
    expectTypeOf<ActionOf<"TOGGLE_ORDER_PAID">["data"]>().toEqualTypeOf<OrderPaidToggleData | undefined>();
    expectTypeOf<ActionOf<"UPDATE_RESERVATION_STATUS">["data"]>().toEqualTypeOf<ReservationStatusData | undefined>();
    expectTypeOf<ActionOf<"UPDATE_GAME_REWARD">["data"]>().toEqualTypeOf<GameRewardAdminData | undefined>();
  });

  it("narrows the payload by the discriminant", () => {
    const action = { type: "TOGGLE_ORDER_PAID", label: "Mark paid" } as AdminAction;

    if (action.type === "TOGGLE_ORDER_PAID") {
      expectTypeOf(action.data).toEqualTypeOf<OrderPaidToggleData | undefined>();
    }
    if (action.type === "UPDATE_GAME_REWARD") {
      expectTypeOf(action.data).toEqualTypeOf<GameRewardAdminData | undefined>();
    }
    expect(action.type).toBe("TOGGLE_ORDER_PAID");
  });

  it("accepts every action with and without a payload", () => {
    const actions: AdminAction[] = [
      { type: "NAVIGATE_ADMIN", label: "Go", data: { tab: "analytics" } },
      { type: "NAVIGATE_ADMIN", label: "Go" },
      { type: "VIEW_REVENUE", label: "Revenue", data: { range: "7d", metric: "revenue" } },
      { type: "VIEW_ORDER_STATS", label: "Orders", data: { range: "today" } },
      { type: "VIEW_TOP_ITEMS", label: "Top", data: { metric: "top_items" } },
      { type: "TOGGLE_ITEM_ACTIVE", label: "Toggle", data: { id: "i-1" } },
      { type: "TOGGLE_ITEM_POPULAR", label: "Toggle", data: { id: "i-1" } },
      { type: "UPDATE_ORDER_STATUS", label: "Update", data: { orderId: "o-1", status: "ready" } },
      { type: "TOGGLE_ORDER_PAID", label: "Paid", data: { orderId: "o-1", isPaid: true } },
      { type: "UPDATE_RESERVATION_STATUS", label: "Update", data: { bookingId: "b-1", status: "confirmed" } },
      { type: "TOGGLE_BRANCH_ACTIVE", label: "Toggle", data: { id: "br-1" } },
      { type: "TOGGLE_COUPON_ACTIVE", label: "Toggle", data: { id: "c-1" } },
      { type: "UPDATE_GAME_REWARD", label: "Reward", data: { rewardKey: "k", isActive: false } },
    ];

    expect(actions.map(groupOf)).toEqual([
      "nav",
      "nav",
      "analytics",
      "analytics",
      "analytics",
      "entity-toggle",
      "entity-toggle",
      "order-status",
      "order-paid",
      "reservation-status",
      "entity-toggle",
      "entity-toggle",
      "game-reward",
    ]);
  });

  it("rejects invalid actions at compile time", () => {
    // Each directive must stay on the line that contains the error.
    // If a type is loosened, the directive becomes "unused" and tsc fails.
    // @ts-expect-error unknown action type
    accept({ type: "NOPE", label: "x" });
    // @ts-expect-error label is required
    accept({ type: "NAVIGATE_ADMIN" });
    // @ts-expect-error label must be a string
    accept({ type: "NAVIGATE_ADMIN", label: 1 });
    // @ts-expect-error tab must be a known admin tab
    accept({ type: "NAVIGATE_ADMIN", label: "x", data: { tab: "settings" } });
    // @ts-expect-error range must be a known analytics range
    accept({ type: "VIEW_REVENUE", label: "x", data: { range: "1y" } });
    // @ts-expect-error metric must be a known analytics metric
    accept({ type: "VIEW_TOP_ITEMS", label: "x", data: { metric: "profit" } });
    // @ts-expect-error isPaid must be a boolean
    accept({ type: "TOGGLE_ORDER_PAID", label: "x", data: { isPaid: "yes" } });
    // @ts-expect-error entity toggles only carry an id
    accept({ type: "TOGGLE_BRANCH_ACTIVE", label: "x", data: { orderId: "o-1" } });
    // @ts-expect-error order status cannot carry a bookingId
    accept({ type: "UPDATE_ORDER_STATUS", label: "x", data: { bookingId: "b-1" } });
    // @ts-expect-error reservation status cannot carry an orderId
    accept({ type: "UPDATE_RESERVATION_STATUS", label: "x", data: { orderId: "o-1" } });
    // @ts-expect-error isActive must be a boolean
    accept({ type: "UPDATE_GAME_REWARD", label: "x", data: { isActive: "true" } });
    // @ts-expect-error unknown game reward field
    accept({ type: "UPDATE_GAME_REWARD", label: "x", data: { color: "red" } });

    expect(true).toBe(true);
  });
});