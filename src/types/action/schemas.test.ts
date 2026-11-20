import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";

import { ORDER_STATUSES, SLOT_FILL_ACTIONS } from "@/lib/ai/constants";

import type { ActionPayload } from "./core";
import {
  ACTION_TYPE_NAMES,
  ADMIN_ONLY_ACTIONS,
  ActionPayloadSchema,
  DESTRUCTIVE_ACTIONS,
  SIGNED_IN_ONLY_ACTIONS,
  SLOT_FILL_ACTION_TYPES,
} from "./schemas";

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const UUID_UPPER = UUID.toUpperCase();
const NOT_A_UUID = "not-a-uuid";

function action(type: string, data?: unknown, label = "Do it"): Record<string, unknown> {
  return data === undefined ? { type, label } : { type, label, data };
}

function parse(input: unknown) {
  return ActionPayloadSchema.safeParse(input);
}

function accepted(input: unknown): ActionPayload {
  const result = parse(input);
  if (!result.success) {
    throw new Error(`Expected input to parse: ${JSON.stringify(input)}`);
  }
  return result.data;
}

function dataOf(input: unknown): unknown {
  return (accepted(input) as { data?: unknown }).data;
}

function expectAccepted(type: string, data: unknown) {
  expect(parse(action(type, data)).success).toBe(true);
}

function expectRejected(type: string, data: unknown) {
  expect(parse(action(type, data)).success).toBe(false);
}

const x = (length: number) => "x".repeat(length);

describe("ACTION_TYPE_NAMES", () => {
  it("has no duplicates", () => {
    expect(new Set(ACTION_TYPE_NAMES).size).toBe(ACTION_TYPE_NAMES.length);
  });

  it("lists 42 actions", () => {
    expect(ACTION_TYPE_NAMES).toHaveLength(42);
  });

  it.each([...ACTION_TYPE_NAMES])("has a schema for %s (data is optional)", (type) => {
    const result = parse(action(type));

    expect(result.success).toBe(true);
    expect((result as { data: { type: string } }).data.type).toBe(type);
  });

  it("rejects a type that is not in the list", () => {
    expect(parse(action("NOT_AN_ACTION")).success).toBe(false);
  });

  it("is case sensitive", () => {
    expect(parse(action("add_to_cart")).success).toBe(false);
  });
});

describe("ActionPayloadSchema - envelope", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "ADD_TO_CART"],
    ["a number", 42],
    ["an array", []],
    ["an empty object", {}],
  ])("rejects %s", (_label, input) => {
    expect(parse(input).success).toBe(false);
  });

  it("rejects a missing or non-string type", () => {
    expect(parse({ label: "x" }).success).toBe(false);
    expect(parse({ type: 1, label: "x" }).success).toBe(false);
    expect(parse({ type: null, label: "x" }).success).toBe(false);
  });

  it("rejects unknown top-level keys on every action type", () => {
    for (const type of ACTION_TYPE_NAMES) {
      expect(parse({ ...action(type), extra: true }).success).toBe(false);
    }
  });

  it("does not mutate its input", () => {
    const input = action("FILTER_MENU", { category: "  Coffee  " }, "  Filter  ");
    const snapshot = structuredClone(input);

    parse(input);

    expect(input).toEqual(snapshot);
  });

  it("outputs a value typed as ActionPayload", () => {
    expectTypeOf<z.infer<typeof ActionPayloadSchema>>().toEqualTypeOf<ActionPayload>();
  });
});

describe("ActionPayloadSchema - label", () => {
  it.each([...ACTION_TYPE_NAMES])("requires a label on %s", (type) => {
    expect(parse({ type }).success).toBe(false);
  });

  it("trims the label", () => {
    const result = accepted(action("OPEN_CONTACT", undefined, "  Contact us  "));
    expect(result.label).toBe("Contact us");
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "   \t\n"],
    ["a number", 5],
    ["null", null],
    ["161 characters", x(161)],
  ])("rejects a label that is %s", (_label, label) => {
    expect(parse({ type: "OPEN_CONTACT", label }).success).toBe(false);
  });

  it("accepts a label of exactly 160 characters", () => {
    expect(parse({ type: "OPEN_CONTACT", label: x(160) }).success).toBe(true);
  });

  it("measures the 160 limit after trimming", () => {
    expect(parse({ type: "OPEN_CONTACT", label: `  ${x(160)}  ` }).success).toBe(true);
  });
});

describe("ActionPayloadSchema - data stripping", () => {
  it("strips unknown keys from structured data", () => {
    expect(dataOf(action("FILTER_MENU", { category: "Coffee", color: "red" }))).toEqual({
      category: "Coffee",
    });
  });

  it("strips fields that belong to a different action", () => {
    expect(dataOf(action("REMOVE_FROM_CART", { itemId: UUID, itemPrice: 9, quantity: 2 }))).toEqual({
      itemId: UUID,
      quantity: 2,
    });
  });

  it.each([
    "OPEN_DIRECTIONS",
    "OPEN_CONTACT",
    "VIEW_RESERVATIONS",
    "CLEAR_CART",
    "VIEW_FAVORITES",
    "VIEW_COUPONS",
    "OPEN_NOTIFICATIONS",
    "MUTE_ALL_NOTIFICATIONS",
    "UNMUTE_ALL_NOTIFICATIONS",
    "ENABLE_PUSH",
    "DISABLE_PUSH",
  ])("lets %s carry arbitrary data (passthrough)", (type) => {
    expect(dataOf(action(type, { anything: 1, nested: { a: true } }))).toEqual({
      anything: 1,
      nested: { a: true },
    });
  });

  it("rejects non-object data", () => {
    for (const type of ["FILTER_MENU", "OPEN_CONTACT", "ADD_TO_CART"]) {
      expectRejected(type, "text");
      expectRejected(type, 5);
      expectRejected(type, [1]);
    }
  });
});

describe("navigation and menu", () => {
  it("accepts a section id between 1 and 120 characters, trimmed", () => {
    expect(dataOf(action("NAVIGATE_SECTION", { sectionId: "  menu  " }))).toEqual({
      sectionId: "menu",
    });
    expectAccepted("NAVIGATE_SECTION", { sectionId: x(120) });
    expectRejected("NAVIGATE_SECTION", { sectionId: x(121) });
    expectRejected("NAVIGATE_SECTION", { sectionId: "   " });
    expectRejected("NAVIGATE_SECTION", { sectionId: 1 });
  });

  it("validates menu filters", () => {
    expectAccepted("FILTER_MENU", {
      category: "Coffee",
      maxPrice: 6.5,
      dietary: ["vegan", "gluten-free"],
      search: "latte",
    });
    expectAccepted("FILTER_MENU", {});
  });

  it.each([
    ["category over 80", { category: x(81) }],
    ["search over 200", { search: x(201) }],
    ["a negative maxPrice", { maxPrice: -1 }],
    ["a maxPrice over 1,000,000", { maxPrice: 1_000_001 }],
    ["a NaN maxPrice", { maxPrice: Number.NaN }],
    ["an infinite maxPrice", { maxPrice: Number.POSITIVE_INFINITY }],
    ["a string maxPrice", { maxPrice: "5" }],
    ["more than 10 dietary tags", { dietary: Array.from({ length: 11 }, () => "v") }],
    ["a dietary tag over 40", { dietary: [x(41)] }],
    ["a non-array dietary", { dietary: "vegan" }],
  ])("rejects menu filter with %s", (_label, data) => {
    expectRejected("FILTER_MENU", data);
  });

  it("accepts the boundary values", () => {
    expectAccepted("FILTER_MENU", { maxPrice: 0 });
    expectAccepted("FILTER_MENU", { maxPrice: 1_000_000 });
    expectAccepted("FILTER_MENU", { category: x(80), search: x(200) });
    expectAccepted("FILTER_MENU", { dietary: Array.from({ length: 10 }, () => x(40)) });
  });

  it("trims filter strings", () => {
    expect(dataOf(action("FILTER_MENU", { category: "  Cold ", search: " tea " }))).toEqual({
      category: "Cold",
      search: "tea",
    });
  });
});

describe("reservations", () => {
  it("accepts a full reservation payload", () => {
    const data = {
      date: "2026-12-01",
      time: "19:30",
      partySize: 4,
      locationId: UUID,
      guests: 4,
      branchId: UUID,
      branchName: "Downtown",
    };

    expect(dataOf(action("PREFILL_RESERVATION", data))).toEqual(data);
  });

  it.each([
    ["2026-1-1"],
    ["12/01/2026"],
    ["2026-12-01T10:00"],
    ["tomorrow"],
    [""],
  ])("rejects the date %s", (date) => {
    expectRejected("PREFILL_RESERVATION", { date });
  });

  it.each([["7:30"], ["19:30:00"], ["7pm"], [""]])("rejects the time %s", (time) => {
    expectRejected("PREFILL_RESERVATION", { time });
  });

  it("only checks the date and time format, not calendar validity", () => {
    // Documents current behavior: impossible values pass the regex.
    expectAccepted("PREFILL_RESERVATION", { date: "2026-13-45", time: "99:99" });
  });

  it("trims date and time", () => {
    expect(
      dataOf(action("PREFILL_RESERVATION", { date: " 2026-12-01 ", time: " 19:30 " })),
    ).toEqual({ date: "2026-12-01", time: "19:30" });
  });

  it.each(["partySize", "guests"])("limits %s to integers from 1 to 100", (key) => {
    expectAccepted("PREFILL_RESERVATION", { [key]: 1 });
    expectAccepted("PREFILL_RESERVATION", { [key]: 100 });
    expectRejected("PREFILL_RESERVATION", { [key]: 0 });
    expectRejected("PREFILL_RESERVATION", { [key]: 101 });
    expectRejected("PREFILL_RESERVATION", { [key]: 2.5 });
    expectRejected("PREFILL_RESERVATION", { [key]: "2" });
  });

  it.each(["locationId", "branchId"])("requires %s to be a UUID", (key) => {
    expectAccepted("PREFILL_RESERVATION", { [key]: UUID });
    expectRejected("PREFILL_RESERVATION", { [key]: NOT_A_UUID });
  });

  it("limits branchName to 160 characters", () => {
    expectAccepted("PREFILL_RESERVATION", { branchName: x(160) });
    expectRejected("PREFILL_RESERVATION", { branchName: x(161) });
  });

  it("validates the booking id when cancelling", () => {
    expectAccepted("CANCEL_BOOKING", { bookingId: UUID });
    expectAccepted("CANCEL_BOOKING", {});
    expectRejected("CANCEL_BOOKING", { bookingId: NOT_A_UUID });
  });
});

describe("UUID handling", () => {
  it("accepts upper-case UUIDs and keeps their case", () => {
    expect(dataOf(action("CANCEL_BOOKING", { bookingId: UUID_UPPER }))).toEqual({
      bookingId: UUID_UPPER,
    });
  });

  it("trims surrounding whitespace before matching", () => {
    expect(dataOf(action("CANCEL_BOOKING", { bookingId: `  ${UUID}  ` }))).toEqual({
      bookingId: UUID,
    });
  });

  it.each([
    ["too short", UUID.slice(0, -1)],
    ["too long", `${UUID}0`],
    ["missing dashes", UUID.replaceAll("-", "")],
    ["non-hex characters", UUID.replace("1", "z")],
    ["empty", ""],
  ])("rejects a UUID that is %s", (_label, bookingId) => {
    expectRejected("CANCEL_BOOKING", { bookingId });
  });

  it("does not check UUID version or variant bits", () => {
    expectAccepted("CANCEL_BOOKING", { bookingId: "00000000-0000-0000-0000-000000000000" });
  });
});

describe("cart", () => {
  const line = { itemId: UUID, itemName: "Flat White", itemPrice: 4.5, quantity: 2 };

  it("accepts a single item and a batch of items", () => {
    expect(dataOf(action("ADD_TO_CART", line))).toEqual(line);
    expect(dataOf(action("ADD_TO_CART", { items: [line, line] }))).toEqual({ items: [line, line] });
  });

  it("silently drops an invalid itemId instead of rejecting (catch)", () => {
    const single = dataOf(action("ADD_TO_CART", { ...line, itemId: NOT_A_UUID })) as {
      itemId?: string;
      itemName?: string;
    };
    expect(single.itemId).toBeUndefined();
    expect(single.itemName).toBe("Flat White");

    const batch = dataOf(
      action("UPDATE_CART_ITEM", { items: [{ itemId: 42, quantity: 3 }] }),
    ) as { items: { itemId?: string; quantity?: number }[] };
    expect(batch.items[0].itemId).toBeUndefined();
    expect(batch.items[0].quantity).toBe(3);
  });

  it.each(["ADD_TO_CART", "REMOVE_FROM_CART", "UPDATE_CART_ITEM"])(
    "limits %s quantity to integers from 1 to 100",
    (type) => {
      expectAccepted(type, { quantity: 1 });
      expectAccepted(type, { quantity: 100 });
      expectRejected(type, { quantity: 0 });
      expectRejected(type, { quantity: 101 });
      expectRejected(type, { quantity: 1.5 });
      expectRejected(type, { quantity: "2" });
    },
  );

  it("limits batches to 50 items", () => {
    const items = (count: number) => Array.from({ length: count }, () => ({ itemId: UUID }));

    expectAccepted("ADD_TO_CART", { items: items(50) });
    expectRejected("ADD_TO_CART", { items: items(51) });
    expectAccepted("REMOVE_FROM_CART", { items: items(50) });
    expectRejected("UPDATE_CART_ITEM", { items: items(51) });
  });

  it("limits the price to 0..1,000,000", () => {
    expectAccepted("ADD_TO_CART", { itemPrice: 0 });
    expectAccepted("ADD_TO_CART", { itemPrice: 1_000_000 });
    expectRejected("ADD_TO_CART", { itemPrice: -0.01 });
    expectRejected("ADD_TO_CART", { itemPrice: 1_000_001 });
    expectRejected("ADD_TO_CART", { itemPrice: Number.NaN });
    expectRejected("ADD_TO_CART", { items: [{ itemPrice: -1 }] });
  });

  it("limits itemName to 200 characters", () => {
    expectAccepted("ADD_TO_CART", { itemName: x(200) });
    expectRejected("ADD_TO_CART", { itemName: x(201) });
  });

  it("validates line items inside a batch", () => {
    expectRejected("ADD_TO_CART", { items: [{ quantity: 0 }] });
    expectRejected("ADD_TO_CART", { items: "nope" });
  });

  it("allows CLEAR_CART with no data", () => {
    expect(accepted(action("CLEAR_CART")).type).toBe("CLEAR_CART");
  });
});

describe("checkout and coupons", () => {
  it("accepts a full checkout payload", () => {
    const data = {
      orderType: "delivery",
      paymentMethod: "in_person",
      name: "Shaurya",
      phone: "+91 98765 43210",
      address: "12 Park Street",
    };

    expect(dataOf(action("START_CHECKOUT", data))).toEqual(data);
  });

  it.each([
    ["orderType", "drone"],
    ["orderType", "Pickup"],
    ["paymentMethod", "cash"],
    ["paymentMethod", "ONLINE"],
  ])("rejects %s = %s", (key, value) => {
    expectRejected("START_CHECKOUT", { [key]: value });
  });

  it("limits name, phone and address lengths", () => {
    expectAccepted("START_CHECKOUT", { name: x(200), phone: x(40), address: x(500) });
    expectRejected("START_CHECKOUT", { name: x(201) });
    expectRejected("START_CHECKOUT", { phone: x(41) });
    expectRejected("START_CHECKOUT", { address: x(501) });
  });

  it("requires a coupon code of 1 to 64 characters after trimming", () => {
    expect(dataOf(action("APPLY_COUPON", { code: "  SAVE10  " }))).toEqual({ code: "SAVE10" });
    expectAccepted("APPLY_COUPON", { code: x(64) });
    expectRejected("APPLY_COUPON", { code: x(65) });
    expectRejected("APPLY_COUPON", { code: "   " });
    expectRejected("APPLY_COUPON", { code: "" });
    expectAccepted("APPLY_COUPON", {});
  });
});

describe("orders, favorites and rewards", () => {
  it("accepts only the active and history order tabs", () => {
    expectAccepted("VIEW_ORDERS", { tab: "active" });
    expectAccepted("VIEW_ORDERS", { tab: "history" });
    expectRejected("VIEW_ORDERS", { tab: "all" });
    expectRejected("VIEW_ORDERS", { tab: "Active" });
  });

  it("requires a UUID order id when rating", () => {
    expectAccepted("RATE_ORDER", { orderId: UUID });
    expectRejected("RATE_ORDER", { orderId: NOT_A_UUID });
  });

  it.each(["ADD_TO_FAVORITES", "REMOVE_FROM_FAVORITES"])(
    "rejects an invalid itemId for %s (no catch here)",
    (type) => {
      expectAccepted(type, { itemId: UUID, itemName: "Latte" });
      expectRejected(type, { itemId: NOT_A_UUID });
      expectRejected(type, { itemName: x(201) });
    },
  );

  it("limits the reward key to 1..120 characters", () => {
    expectAccepted("OPEN_REWARD", { rewardKey: "welcome-bonus" });
    expectAccepted("OPEN_REWARD", { rewardKey: x(120) });
    expectRejected("OPEN_REWARD", { rewardKey: x(121) });
    expectRejected("OPEN_REWARD", { rewardKey: "  " });
  });
});

describe("notifications, theme and palette", () => {
  it.each(["MUTE_NOTIFICATION_TYPE", "UNMUTE_NOTIFICATION_TYPE"])(
    "requires a notification type of 1..80 characters for %s",
    (type) => {
      expect(dataOf(action(type, { type: "  order_ready " }))).toEqual({ type: "order_ready" });
      expectAccepted(type, { type: x(80) });
      expectRejected(type, { type: x(81) });
      expectRejected(type, { type: "  " });
    },
  );

  it.each([
    ["light", "light"],
    ["DARK", "dark"],
    ["  System ", "system"],
  ])("normalizes theme mode %j to %s", (input, expected) => {
    expect(dataOf(action("SET_THEME_MODE", { mode: input }))).toEqual({ mode: expected });
  });

  it.each([["auto"], ["blue"], [""], [1]])("rejects theme mode %j", (mode) => {
    expectRejected("SET_THEME_MODE", { mode });
  });

  it.each([
    ["espresso", "espresso"],
    ["EMERALD", "emerald"],
    [" Rosewood ", "rosewood"],
    ["champagne", "champagne"],
  ])("normalizes palette %j to %s", (input, expected) => {
    expect(dataOf(action("SET_COLOR_PALETTE", { palette: input }))).toEqual({ palette: expected });
  });

  it.each([["ocean"], [""], [null]])("rejects palette %j", (palette) => {
    expectRejected("SET_COLOR_PALETTE", { palette });
  });
});

describe("sign-in gate (REQUIRE_SIGNIN)", () => {
  it("accepts an empty gate", () => {
    expect(accepted(action("REQUIRE_SIGNIN")).type).toBe("REQUIRE_SIGNIN");
    expectAccepted("REQUIRE_SIGNIN", {});
  });

  it("accepts a resume action with its data", () => {
    const data = {
      resumeAction: "ADD_TO_CART",
      resumeData: { itemId: UUID, itemName: "Latte", itemPrice: 4, quantity: 2 },
    };

    expect(dataOf(action("REQUIRE_SIGNIN", data))).toEqual(data);
  });

  it("accepts checkout and reservation fields in resumeData", () => {
    const resumeData = {
      date: "2026-12-01",
      time: "19:30",
      partySize: 2,
      orderType: "pickup",
      paymentMethod: "online",
      phone: "555",
    };

    expect(dataOf(action("REQUIRE_SIGNIN", { resumeAction: "START_CHECKOUT", resumeData }))).toEqual({
      resumeAction: "START_CHECKOUT",
      resumeData,
    });
  });

  it("accepts every known action as a resumeAction and rejects unknown ones", () => {
    for (const resumeAction of ACTION_TYPE_NAMES) {
      expectAccepted("REQUIRE_SIGNIN", { resumeAction });
    }
    expectRejected("REQUIRE_SIGNIN", { resumeAction: "NOPE" });
  });

  it("strips unknown keys from resumeData", () => {
    expect(
      dataOf(action("REQUIRE_SIGNIN", { resumeData: { quantity: 2, secret: "x", bookingId: UUID } })),
    ).toEqual({ resumeData: { quantity: 2 } });
  });

  it("reuses the field rules of the underlying schemas", () => {
    expectRejected("REQUIRE_SIGNIN", { resumeData: { quantity: 0 } });
    expectRejected("REQUIRE_SIGNIN", { resumeData: { date: "soon" } });
    expectRejected("REQUIRE_SIGNIN", { resumeData: { orderType: "drone" } });
    expectRejected("REQUIRE_SIGNIN", { resumeData: { locationId: NOT_A_UUID } });
  });

  it("drops an invalid itemId in resumeData, like the cart does", () => {
    const resume = dataOf(
      action("REQUIRE_SIGNIN", { resumeData: { itemId: NOT_A_UUID, quantity: 1 } }),
    ) as { resumeData: { itemId?: string; quantity?: number } };

    expect(resume.resumeData.itemId).toBeUndefined();
    expect(resume.resumeData.quantity).toBe(1);
  });
});

describe("admin actions", () => {
  it("accepts every admin tab and rejects others", () => {
    for (const tab of ["orders", "reservations", "inventory", "branches", "analytics", "coupons"]) {
      expectAccepted("NAVIGATE_ADMIN", { tab });
    }
    expectRejected("NAVIGATE_ADMIN", { tab: "settings" });
    expectRejected("NAVIGATE_ADMIN", { tab: "Orders" });
  });

  it.each(["VIEW_REVENUE", "VIEW_ORDER_STATS", "VIEW_TOP_ITEMS"])(
    "validates the analytics query for %s",
    (type) => {
      for (const range of ["today", "7d", "30d", "90d", "all"]) {
        expectAccepted(type, { range });
      }
      for (const metric of ["revenue", "orders", "aov", "top_items", "bottom_items"]) {
        expectAccepted(type, { metric });
      }
      expectRejected(type, { range: "1y" });
      expectRejected(type, { metric: "profit" });
    },
  );

  it("accepts every known order status and rejects unknown ones", () => {
    for (const status of ORDER_STATUSES) {
      expectAccepted("UPDATE_ORDER_STATUS", { orderId: UUID, status });
    }
    expectRejected("UPDATE_ORDER_STATUS", { status: "definitely-not-a-status" });
    expectRejected("UPDATE_ORDER_STATUS", { orderId: NOT_A_UUID });
  });

  it("restricts reservation statuses", () => {
    for (const status of ["pending", "confirmed", "completed", "cancelled"]) {
      expectAccepted("UPDATE_RESERVATION_STATUS", { bookingId: UUID, status });
    }
    expectRejected("UPDATE_RESERVATION_STATUS", { status: "canceled" });
    expectRejected("UPDATE_RESERVATION_STATUS", { bookingId: NOT_A_UUID });
  });

  it("requires a strict boolean for isPaid", () => {
    expectAccepted("TOGGLE_ORDER_PAID", { orderId: UUID, isPaid: true });
    expectAccepted("TOGGLE_ORDER_PAID", { orderId: UUID, isPaid: false });
    expectRejected("TOGGLE_ORDER_PAID", { isPaid: "true" });
    expectRejected("TOGGLE_ORDER_PAID", { isPaid: 1 });
    expectRejected("TOGGLE_ORDER_PAID", { orderId: NOT_A_UUID });
  });

  it.each([
    "TOGGLE_ITEM_ACTIVE",
    "TOGGLE_ITEM_POPULAR",
    "TOGGLE_BRANCH_ACTIVE",
    "TOGGLE_COUPON_ACTIVE",
  ])("requires a UUID id for %s", (type) => {
    expectAccepted(type, { id: UUID });
    expectAccepted(type, {});
    expectRejected(type, { id: NOT_A_UUID });
  });

  it("validates a game reward update", () => {
    const data = {
      rewardKey: "spin-wheel",
      title: "Free cookie",
      promoCode: "COOKIE",
      discountValue: "10%",
      description: "Win a cookie",
      isActive: true,
    };

    expect(dataOf(action("UPDATE_GAME_REWARD", data))).toEqual(data);
    expectRejected("UPDATE_GAME_REWARD", { isActive: "true" });
    expectRejected("UPDATE_GAME_REWARD", { title: x(201) });
    expectRejected("UPDATE_GAME_REWARD", { promoCode: x(65) });
    expectRejected("UPDATE_GAME_REWARD", { discountValue: x(65) });
    expectRejected("UPDATE_GAME_REWARD", { description: x(1001) });
    expectRejected("UPDATE_GAME_REWARD", { rewardKey: x(121) });
    expectAccepted("UPDATE_GAME_REWARD", { description: x(1000), title: x(200) });
  });
});

describe("SLOT_FILL_ACTION_TYPES", () => {
  it("mirrors the keys of SLOT_FILL_ACTIONS", () => {
    expect([...SLOT_FILL_ACTION_TYPES].sort()).toEqual(Object.keys(SLOT_FILL_ACTIONS).sort());
  });

  it("only contains known action types", () => {
    const known = new Set<string>(ACTION_TYPE_NAMES);

    for (const type of SLOT_FILL_ACTION_TYPES) {
      expect(known.has(type)).toBe(true);
    }
  });
});

describe("action classification sets", () => {
  const known = new Set<string>(ACTION_TYPE_NAMES);

  it.each([
    ["SIGNED_IN_ONLY_ACTIONS", SIGNED_IN_ONLY_ACTIONS],
    ["ADMIN_ONLY_ACTIONS", ADMIN_ONLY_ACTIONS],
    ["DESTRUCTIVE_ACTIONS", DESTRUCTIVE_ACTIONS],
  ])("%s only contains known action types", (_name, set) => {
    for (const type of set) {
      expect(known.has(type)).toBe(true);
    }
  });

  it("has the expected set sizes", () => {
    expect(SIGNED_IN_ONLY_ACTIONS.size).toBe(24);
    expect(ADMIN_ONLY_ACTIONS.size).toBe(12);
    expect(DESTRUCTIVE_ACTIONS.size).toBe(8);
  });

  it("never marks an action as both signed-in-only and admin-only", () => {
    for (const type of ADMIN_ONLY_ACTIONS) {
      expect(SIGNED_IN_ONLY_ACTIONS.has(type)).toBe(false);
    }
  });

  it("treats every NAVIGATE_ADMIN / VIEW_* analytics / TOGGLE_* admin action as admin-only", () => {
    for (const type of ACTION_TYPE_NAMES) {
      const isAdminShaped =
        type === "NAVIGATE_ADMIN" ||
        ["VIEW_REVENUE", "VIEW_ORDER_STATS", "VIEW_TOP_ITEMS"].includes(type) ||
        /^TOGGLE_(ITEM|BRANCH|COUPON)_/.test(type) ||
        ["UPDATE_ORDER_STATUS", "TOGGLE_ORDER_PAID", "UPDATE_RESERVATION_STATUS", "UPDATE_GAME_REWARD"].includes(type);

      expect(ADMIN_ONLY_ACTIONS.has(type)).toBe(isAdminShaped);
    }
  });

  it("makes every destructive action either admin-only or CLEAR_CART", () => {
    for (const type of DESTRUCTIVE_ACTIONS) {
      expect(ADMIN_ONLY_ACTIONS.has(type) || type === "CLEAR_CART").toBe(true);
    }
    expect(DESTRUCTIVE_ACTIONS.has("CLEAR_CART")).toBe(true);
  });

  it("leaves exactly the public actions unrestricted", () => {
    const unrestricted = ACTION_TYPE_NAMES.filter(
      (type) => !SIGNED_IN_ONLY_ACTIONS.has(type) && !ADMIN_ONLY_ACTIONS.has(type),
    );

    expect([...unrestricted].sort()).toEqual(
      [
        "FILTER_MENU",
        "NAVIGATE_SECTION",
        "OPEN_CONTACT",
        "OPEN_DIRECTIONS",
        "OPEN_NOTIFICATIONS",
        "REQUIRE_SIGNIN",
      ].sort(),
    );
  });

  it("requires sign-in for every cart-mutating action", () => {
    for (const type of [
      "ADD_TO_CART",
      "REMOVE_FROM_CART",
      "UPDATE_CART_ITEM",
      "CLEAR_CART",
      "START_CHECKOUT",
      "APPLY_COUPON",
    ] as const) {
      expect(SIGNED_IN_ONLY_ACTIONS.has(type)).toBe(true);
    }
  });
});