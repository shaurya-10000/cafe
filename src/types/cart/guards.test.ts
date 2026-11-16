import { describe, expect, expectTypeOf, it } from "vitest";

import {
  CART_ITEM_MAX_QUANTITY,
  CART_ITEM_MIN_QUANTITY,
  clampCartQuantity,
  isCartItem,
} from "./guards";
import type { CartItem } from "./types";

const VALID_ITEM: CartItem = {
  id: "item-1",
  name: "Flat White",
  price: "$4.50",
  numeric_price: 4.5,
  quantity: 2,
};

function withOverride(overrides: Record<string, unknown>): unknown {
  return { ...VALID_ITEM, ...overrides };
}

function withoutKey(key: keyof CartItem): unknown {
  const copy: Record<string, unknown> = { ...VALID_ITEM };
  delete copy[key];
  return copy;
}

describe("quantity bounds", () => {
  it("exposes the 1..100 limits", () => {
    expect(CART_ITEM_MIN_QUANTITY).toBe(1);
    expect(CART_ITEM_MAX_QUANTITY).toBe(100);
  });
});

describe("clampCartQuantity", () => {
  it.each([
    [1, 1],
    [2, 2],
    [50, 50],
    [99, 99],
    [100, 100],
  ])("keeps in-range integer %s unchanged", (input, expected) => {
    expect(clampCartQuantity(input)).toBe(expected);
  });

  it.each([
    [1.1, 1],
    [2.9, 2],
    [99.99, 99],
    [100.9, 100],
  ])("floors fractional value %s to %s", (input, expected) => {
    expect(clampCartQuantity(input)).toBe(expected);
  });

  it.each([
    [0, 1],
    [-0, 1],
    [0.5, 1],
    [0.999, 1],
    [-1, 1],
    [-1000, 1],
    [Number.MIN_SAFE_INTEGER, 1],
    [-Number.MAX_VALUE, 1],
  ])("raises %s up to the minimum", (input, expected) => {
    expect(clampCartQuantity(input)).toBe(expected);
  });

  it.each([
    [101, 100],
    [1000, 100],
    [Number.MAX_SAFE_INTEGER, 100],
    [Number.MAX_VALUE, 100],
  ])("caps %s at the maximum", (input, expected) => {
    expect(clampCartQuantity(input)).toBe(expected);
  });

  it.each([
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
  ])("falls back to the minimum for %s", (_label, input) => {
    expect(clampCartQuantity(input)).toBe(CART_ITEM_MIN_QUANTITY);
  });

  it("always returns an integer within bounds for a sweep of inputs", () => {
    for (let value = -250; value <= 250; value += 0.37) {
      const result = clampCartQuantity(value);

      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(CART_ITEM_MIN_QUANTITY);
      expect(result).toBeLessThanOrEqual(CART_ITEM_MAX_QUANTITY);
    }
  });

  it("is idempotent", () => {
    for (const value of [-5, 0, 0.4, 1, 7.8, 100, 250, Number.NaN]) {
      const once = clampCartQuantity(value);
      expect(clampCartQuantity(once)).toBe(once);
    }
  });

  it("is monotonic for finite inputs", () => {
    let previous = clampCartQuantity(-50);
    for (let value = -49; value <= 150; value += 0.5) {
      const next = clampCartQuantity(value);
      expect(next).toBeGreaterThanOrEqual(previous);
      previous = next;
    }
  });

  it("always produces a quantity that isCartItem accepts", () => {
    const inputs = [-10, 0, 0.2, 1, 3.7, 100, 500, Number.NaN, Infinity, -Infinity];

    for (const input of inputs) {
      const item = { ...VALID_ITEM, quantity: clampCartQuantity(input) };
      expect(isCartItem(item)).toBe(true);
    }
  });
});

describe("isCartItem - valid values", () => {
  it("accepts a well-formed item", () => {
    expect(isCartItem(VALID_ITEM)).toBe(true);
  });

  it.each([
    ["minimum quantity", { quantity: CART_ITEM_MIN_QUANTITY }],
    ["maximum quantity", { quantity: CART_ITEM_MAX_QUANTITY }],
    ["a zero price", { numeric_price: 0, price: "$0.00" }],
    ["a very large price", { numeric_price: 1e9 }],
    ["a fractional price", { numeric_price: 0.01 }],
    ["an empty display price string", { price: "" }],
    ["unicode in the name", { name: "Café Crème ☕" }],
  ])("accepts %s", (_label, overrides) => {
    expect(isCartItem(withOverride(overrides))).toBe(true);
  });

  it("tolerates extra properties", () => {
    expect(isCartItem({ ...VALID_ITEM, image: "/x.png", extra: { a: 1 } })).toBe(true);
  });

  it("accepts class instances and null-prototype objects with the right fields", () => {
    class Item {
      id = "i";
      name = "n";
      price = "$1";
      numeric_price = 1;
      quantity = 1;
    }
    const bare = Object.assign(Object.create(null), VALID_ITEM);

    expect(isCartItem(new Item())).toBe(true);
    expect(isCartItem(bare)).toBe(true);
  });

  it("does not mutate the value it inspects", () => {
    const input = { ...VALID_ITEM };
    const snapshot = structuredClone(input);

    isCartItem(input);

    expect(input).toEqual(snapshot);
  });

  it("narrows unknown to CartItem", () => {
    const value: unknown = VALID_ITEM;

    if (isCartItem(value)) {
      expectTypeOf(value).toEqualTypeOf<CartItem>();
      expect(value.name).toBe("Flat White");
    } else {
      throw new Error("expected the guard to accept VALID_ITEM");
    }
  });
});

describe("isCartItem - non-objects", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "item"],
    ["a number", 42],
    ["a boolean", true],
    ["a symbol", Symbol("item")],
    ["a bigint", BigInt(1)],
    ["an empty object", {}],
    ["an empty array", []],
    ["an array of items", [VALID_ITEM]],
    ["a function", () => VALID_ITEM],
  ])("rejects %s", (_label, value) => {
    expect(isCartItem(value)).toBe(false);
  });

  it("does not throw for hostile input", () => {
    const throwing = new Proxy({}, { get: () => "x" });

    expect(() => isCartItem(throwing)).not.toThrow();
    expect(() => isCartItem(Object.create(null))).not.toThrow();
  });
});

describe("isCartItem - missing fields", () => {
  it.each<keyof CartItem>(["id", "name", "price", "numeric_price", "quantity"])(
    "rejects an item without %s",
    (key) => {
      expect(isCartItem(withoutKey(key))).toBe(false);
    },
  );
});

describe("isCartItem - id and name", () => {
  it.each(["id", "name"] as const)("rejects an empty %s", (key) => {
    expect(isCartItem(withOverride({ [key]: "" }))).toBe(false);
  });

  it.each(["id", "name"] as const)("rejects a non-string %s", (key) => {
    for (const bad of [1, null, undefined, {}, [], true]) {
      expect(isCartItem(withOverride({ [key]: bad }))).toBe(false);
    }
  });

  it("does not trim, so a whitespace-only id or name is accepted", () => {
    // Documents current behavior: only length is checked, not content.
    expect(isCartItem(withOverride({ id: "   ", name: "   " }))).toBe(true);
  });
});

describe("isCartItem - price", () => {
  it.each([
    ["a number", 4.5],
    ["null", null],
    ["undefined", undefined],
    ["an object", {}],
  ])("rejects a display price that is %s", (_label, bad) => {
    expect(isCartItem(withOverride({ price: bad }))).toBe(false);
  });

  it.each([
    ["a numeric string", "4.5"],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
    ["a negative number", -0.01],
    ["null", null],
    ["undefined", undefined],
  ])("rejects numeric_price that is %s", (_label, bad) => {
    expect(isCartItem(withOverride({ numeric_price: bad }))).toBe(false);
  });

  it("accepts negative zero as a price", () => {
    expect(isCartItem(withOverride({ numeric_price: -0 }))).toBe(true);
  });
});

describe("isCartItem - quantity", () => {
  it.each([
    ["zero", 0],
    ["a negative integer", -1],
    ["one above the maximum", CART_ITEM_MAX_QUANTITY + 1],
    ["a fraction", 1.5],
    ["a fraction just below the minimum", 0.999],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a numeric string", "2"],
    ["null", null],
    ["undefined", undefined],
    ["a boxed number", Object(2)],
  ])("rejects quantity that is %s", (_label, bad) => {
    expect(isCartItem(withOverride({ quantity: bad }))).toBe(false);
  });

  it("accepts every integer quantity in range", () => {
    for (let q = CART_ITEM_MIN_QUANTITY; q <= CART_ITEM_MAX_QUANTITY; q += 1) {
      expect(isCartItem(withOverride({ quantity: q }))).toBe(true);
    }
  });

  it("rejects the integers just outside the range", () => {
    expect(isCartItem(withOverride({ quantity: CART_ITEM_MIN_QUANTITY - 1 }))).toBe(false);
    expect(isCartItem(withOverride({ quantity: CART_ITEM_MAX_QUANTITY + 1 }))).toBe(false);
  });
});