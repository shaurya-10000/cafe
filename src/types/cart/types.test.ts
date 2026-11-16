import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  CartAction,
  CartData,
  CartItem,
  CartLineItem,
  CartMutationData,
  CheckoutData,
  CouponApplyData,
  OrderType,
  PaymentMethod,
} from "./types";

type ActionOf<T extends CartAction["type"]> = Extract<CartAction, { type: T }>;

// Compile-time exhaustiveness: adding an action to the union without
// updating this switch fails the type-check, which forces the contract
// (and these tests) to be revisited.
function assertNever(value: never): never {
  throw new Error(`Unhandled cart action: ${JSON.stringify(value)}`);
}

function describeAction(action: CartAction): string {
  switch (action.type) {
    case "ADD_TO_CART":
      return "add";
    case "REMOVE_FROM_CART":
      return "remove";
    case "UPDATE_CART_ITEM":
      return "update";
    case "CLEAR_CART":
      return "clear";
    case "START_CHECKOUT":
      return "checkout";
    case "APPLY_COUPON":
      return "coupon";
    default:
      return assertNever(action);
  }
}

// Used only for compile-time checks of invalid literals below.
function accept(_action: CartAction): void {}

describe("cart types - primitives", () => {
  it("defines the exact CartItem shape", () => {
    expectTypeOf<CartItem>().toEqualTypeOf<{
      id: string;
      name: string;
      price: string;
      numeric_price: number;
      quantity: number;
    }>();
  });

  it("restricts OrderType and PaymentMethod to their literals", () => {
    expectTypeOf<OrderType>().toEqualTypeOf<"delivery" | "pickup">();
    expectTypeOf<PaymentMethod>().toEqualTypeOf<"online" | "in_person">();
  });

  it("makes every CartLineItem field optional", () => {
    expectTypeOf<CartLineItem>().toEqualTypeOf<{
      itemId?: string;
      itemName?: string;
      itemPrice?: number;
      quantity?: number;
    }>();

    const empty: CartLineItem = {};
    expect(empty).toEqual({});
  });

  it("supports both batch (items) and single-item shapes in CartData", () => {
    expectTypeOf<CartData["items"]>().toEqualTypeOf<CartLineItem[] | undefined>();
    expectTypeOf<CartData["itemPrice"]>().toEqualTypeOf<number | undefined>();

    const batch: CartData = { items: [{ itemId: "a", quantity: 2 }] };
    const single: CartData = { itemId: "a", itemName: "Latte", itemPrice: 4.5, quantity: 1 };
    const empty: CartData = {};
    expect([batch, single, empty]).toHaveLength(3);
  });

  it("does not let CartMutationData carry a price", () => {
    expectTypeOf<CartMutationData>().not.toHaveProperty("itemPrice");
    expectTypeOf<CartMutationData["items"]>().toEqualTypeOf<CartLineItem[] | undefined>();
  });

  it("makes every CheckoutData field optional and typed", () => {
    expectTypeOf<CheckoutData["orderType"]>().toEqualTypeOf<OrderType | undefined>();
    expectTypeOf<CheckoutData["paymentMethod"]>().toEqualTypeOf<PaymentMethod | undefined>();
    expectTypeOf<CheckoutData["phone"]>().toEqualTypeOf<string | undefined>();

    const empty: CheckoutData = {};
    expect(empty).toEqual({});
  });

  it("types CouponApplyData with an optional code", () => {
    expectTypeOf<CouponApplyData>().toEqualTypeOf<{ code?: string }>();
  });
});

describe("cart types - CartAction union", () => {
  it("contains exactly the six action types", () => {
    expectTypeOf<CartAction["type"]>().toEqualTypeOf<
      | "ADD_TO_CART"
      | "REMOVE_FROM_CART"
      | "UPDATE_CART_ITEM"
      | "CLEAR_CART"
      | "START_CHECKOUT"
      | "APPLY_COUPON"
    >();
  });

  it("requires a string label on every action", () => {
    expectTypeOf<CartAction["label"]>().toEqualTypeOf<string>();
  });

  it("pairs each action with the right optional payload", () => {
    expectTypeOf<ActionOf<"ADD_TO_CART">["data"]>().toEqualTypeOf<CartData | undefined>();
    expectTypeOf<ActionOf<"REMOVE_FROM_CART">["data"]>().toEqualTypeOf<CartMutationData | undefined>();
    expectTypeOf<ActionOf<"UPDATE_CART_ITEM">["data"]>().toEqualTypeOf<CartMutationData | undefined>();
    expectTypeOf<ActionOf<"CLEAR_CART">["data"]>().toEqualTypeOf<Record<string, never> | undefined>();
    expectTypeOf<ActionOf<"START_CHECKOUT">["data"]>().toEqualTypeOf<CheckoutData | undefined>();
    expectTypeOf<ActionOf<"APPLY_COUPON">["data"]>().toEqualTypeOf<CouponApplyData | undefined>();
  });

  it("narrows the payload by the discriminant", () => {
    const action = { type: "START_CHECKOUT", label: "Checkout" } as CartAction;

    if (action.type === "START_CHECKOUT") {
      expectTypeOf(action.data).toEqualTypeOf<CheckoutData | undefined>();
    }
    if (action.type === "APPLY_COUPON") {
      expectTypeOf(action.data).toEqualTypeOf<CouponApplyData | undefined>();
    }
    expect(action.type).toBe("START_CHECKOUT");
  });

  it("accepts every action with and without a payload", () => {
    const actions: CartAction[] = [
      { type: "ADD_TO_CART", label: "Add" },
      { type: "ADD_TO_CART", label: "Add", data: { itemId: "a", quantity: 1 } },
      { type: "REMOVE_FROM_CART", label: "Remove", data: { itemId: "a" } },
      { type: "UPDATE_CART_ITEM", label: "Update", data: { itemId: "a", quantity: 3 } },
      { type: "CLEAR_CART", label: "Clear" },
      { type: "CLEAR_CART", label: "Clear", data: {} },
      { type: "START_CHECKOUT", label: "Checkout", data: { orderType: "pickup", paymentMethod: "online" } },
      { type: "APPLY_COUPON", label: "Coupon", data: { code: "SAVE10" } },
    ];

    expect(actions.map(describeAction)).toEqual([
      "add",
      "add",
      "remove",
      "update",
      "clear",
      "clear",
      "checkout",
      "coupon",
    ]);
  });

  it("rejects invalid actions at compile time", () => {
    // Each directive below must stay on the line that contains the error.
    // If the type is loosened, the directive becomes "unused" and tsc fails.
    // @ts-expect-error unknown action type
    accept({ type: "NOPE", label: "x" });
    // @ts-expect-error label is required
    accept({ type: "CLEAR_CART" });
    // @ts-expect-error label must be a string
    accept({ type: "CLEAR_CART", label: 1 });
    // @ts-expect-error CLEAR_CART carries no payload fields
    accept({ type: "CLEAR_CART", label: "x", data: { a: 1 } });
    // @ts-expect-error coupon payload cannot carry checkout fields
    accept({ type: "APPLY_COUPON", label: "x", data: { orderType: "pickup" } });
    // @ts-expect-error orderType is limited to delivery | pickup
    accept({ type: "START_CHECKOUT", label: "x", data: { orderType: "drone" } });
    // @ts-expect-error paymentMethod is limited to online | in_person
    accept({ type: "START_CHECKOUT", label: "x", data: { paymentMethod: "cash" } });
    // @ts-expect-error mutations cannot set a price
    accept({ type: "UPDATE_CART_ITEM", label: "x", data: { itemPrice: 1 } });
    // @ts-expect-error quantity must be a number
    accept({ type: "ADD_TO_CART", label: "x", data: { quantity: "2" } });

    expect(true).toBe(true);
  });
});