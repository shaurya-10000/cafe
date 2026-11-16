// guards.test.ts
import { describe, expect, it } from "vitest";

import { isCatalogItem } from "./guards";
import { CATALOG_CATEGORIES, CATALOG_NAME_MAX_LENGTH, type CatalogItem } from "./types";

type Raw = Record<string, unknown>;

function product(overrides: Raw = {}): Raw {
  return {
    id: "item_1",
    name: "Flat white",
    price: "$4.50",
    numeric_price: 4.5,
    description: "Smooth and strong",
    category: "coffee",
    item_type: "product",
    duration_minutes: null,
    media: ["https://example.com/a.jpg"],
    is_popular: false,
    is_active: true,
    rating: 4.5,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

function service(overrides: Raw = {}): Raw {
  return product({
    id: "svc_1",
    name: "Barista class",
    item_type: "service",
    duration_minutes: 60,
    ...overrides,
  });
}

describe("isCatalogItem: accepts valid items", () => {
  it("accepts a product", () => {
    expect(isCatalogItem(product())).toBe(true);
  });

  it("accepts a service", () => {
    expect(isCatalogItem(service())).toBe(true);
  });

  it("accepts null description and null rating", () => {
    expect(isCatalogItem(product({ description: null, rating: null }))).toBe(true);
  });

  it("accepts an empty description string and an empty media list", () => {
    expect(isCatalogItem(product({ description: "", media: [] }))).toBe(true);
  });

  it("ignores extra properties", () => {
    expect(isCatalogItem(product({ extra: "x", nested: { a: 1 } }))).toBe(true);
  });

  it("does not mutate its input", () => {
    const input = product();
    const snapshot = structuredClone(input);

    isCatalogItem(input);

    expect(input).toEqual(snapshot);
  });

  it("narrows the type for callers", () => {
    const value: unknown = product();

    if (!isCatalogItem(value)) throw new Error("expected a valid item");

    expect(value.id).toBe("item_1");
    expect(value.item_type).toBe("product");
  });
});

describe("isCatalogItem: rejects non-objects", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "item"],
    ["a number", 42],
    ["a boolean", true],
    ["a symbol", Symbol("x")],
    ["a function", () => product()],
    ["an empty object", {}],
    ["an empty array", []],
    ["an array of items", [product()]],
    ["a Date", new Date()],
    ["a Map", new Map()],
  ])("rejects %s", (_label, value) => {
    expect(isCatalogItem(value)).toBe(false);
  });
});

describe("isCatalogItem: required fields", () => {
  const keys = Object.keys(product());

  it.each(keys)("rejects an item missing `%s`", (key) => {
    const item = product();
    delete item[key];

    expect(isCatalogItem(item)).toBe(false);
  });

  it.each(["description", "duration_minutes", "rating"])(
    "treats undefined as different from null for `%s`",
    (key) => {
      expect(isCatalogItem(product({ [key]: undefined }))).toBe(false);
    },
  );
});

describe("isCatalogItem: id", () => {
  it.each([
    ["empty", ""],
    ["a number", 1],
    ["null", null],
  ])("rejects an id that is %s", (_label, id) => {
    expect(isCatalogItem(product({ id }))).toBe(false);
  });

  it("accepts a whitespace-only id (only emptiness is checked)", () => {
    // Pinned: the guard does not trim ids, unlike names.
    expect(isCatalogItem(product({ id: " " }))).toBe(true);
  });
});

describe("isCatalogItem: name", () => {
  it("accepts a name exactly at the max length", () => {
    expect(isCatalogItem(product({ name: "a".repeat(CATALOG_NAME_MAX_LENGTH) }))).toBe(true);
  });

  it("rejects a name one character over the max length", () => {
    expect(isCatalogItem(product({ name: "a".repeat(CATALOG_NAME_MAX_LENGTH + 1) }))).toBe(false);
  });

  it("measures the max length on the untrimmed value", () => {
    // Pinned: padding counts toward the limit even though emptiness is judged trimmed.
    const padded = ` ${"a".repeat(CATALOG_NAME_MAX_LENGTH)}`;
    expect(isCatalogItem(product({ name: padded }))).toBe(false);
  });

  it.each([
    ["empty", ""],
    ["spaces only", "   "],
    ["whitespace characters only", "\t\n "],
    ["a number", 5],
    ["null", null],
  ])("rejects a name that is %s", (_label, name) => {
    expect(isCatalogItem(product({ name }))).toBe(false);
  });
});

describe("isCatalogItem: price fields", () => {
  it.each([
    ["a number", 4.5],
    ["null", null],
  ])("rejects a display price that is %s", (_label, price) => {
    expect(isCatalogItem(product({ price }))).toBe(false);
  });

  it("does not cross-check the display price against numeric_price", () => {
    // Pinned: the two fields can disagree and still validate.
    expect(isCatalogItem(product({ price: "$999", numeric_price: 1 }))).toBe(true);
    expect(isCatalogItem(product({ price: "" }))).toBe(true);
  });

  it("accepts the smallest positive numeric price", () => {
    expect(isCatalogItem(product({ numeric_price: Number.MIN_VALUE }))).toBe(true);
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["negative zero", -0],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
    ["a numeric string", "4.5"],
    ["null", null],
  ])("rejects a numeric price that is %s", (_label, numeric_price) => {
    expect(isCatalogItem(product({ numeric_price }))).toBe(false);
  });
});

describe("isCatalogItem: description, category, timestamps", () => {
  it.each([
    ["a number", 5],
    ["an object", {}],
  ])("rejects a description that is %s", (_label, description) => {
    expect(isCatalogItem(product({ description }))).toBe(false);
  });

  it.each([
    ["category", null],
    ["category", 3],
    ["created_at", new Date()],
    ["created_at", 1_700_000_000],
    ["updated_at", null],
    ["updated_at", new Date()],
  ])("rejects a non-string %s (%j)", (key, value) => {
    expect(isCatalogItem(product({ [key]: value }))).toBe(false);
  });

  it("does not validate timestamp or category content", () => {
    // Pinned: any string passes, including garbage dates and empty categories.
    expect(isCatalogItem(product({ category: "", created_at: "not-a-date", updated_at: "" }))).toBe(true);
  });
});

describe("isCatalogItem: item_type", () => {
  it.each([
    ["an unknown string", "bundle"],
    ["a different case", "Product"],
    ["empty", ""],
    ["null", null],
    ["a number", 1],
  ])("rejects item_type that is %s", (_label, item_type) => {
    expect(isCatalogItem(product({ item_type }))).toBe(false);
  });
});

describe("isCatalogItem: duration and type consistency", () => {
  it("requires a duration for services", () => {
    expect(isCatalogItem(service({ duration_minutes: null }))).toBe(false);
  });

  it("forbids a duration on products", () => {
    expect(isCatalogItem(product({ duration_minutes: 30 }))).toBe(false);
  });

  it("accepts a fractional service duration", () => {
    expect(isCatalogItem(service({ duration_minutes: 0.5 }))).toBe(true);
  });

  it.each([
    ["zero", 0],
    ["negative", -15],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a numeric string", "60"],
  ])("rejects a service duration that is %s", (_label, duration_minutes) => {
    expect(isCatalogItem(service({ duration_minutes }))).toBe(false);
  });
});

describe("isCatalogItem: media", () => {
  it.each([
    ["null", null],
    ["a string", "https://example.com/a.jpg"],
    ["an object", { 0: "a" }],
    ["a list with a number", ["a", 1]],
    ["a list with null", ["a", null]],
    ["a nested list", [["a"]]],
  ])("rejects media that is %s", (_label, media) => {
    expect(isCatalogItem(product({ media }))).toBe(false);
  });

  it("does not validate media URLs", () => {
    // Pinned: entries only need to be strings, including empty ones.
    expect(isCatalogItem(product({ media: ["", "not a url"] }))).toBe(true);
  });
});

describe("isCatalogItem: flags", () => {
  it.each(["is_popular", "is_active"])("rejects truthy non-booleans for %s", (key) => {
    for (const value of [1, "true", "false", null, {}]) {
      expect(isCatalogItem(product({ [key]: value }))).toBe(false);
    }
  });

  it.each(["is_popular", "is_active"])("accepts true and false for %s", (key) => {
    expect(isCatalogItem(product({ [key]: true }))).toBe(true);
    expect(isCatalogItem(product({ [key]: false }))).toBe(true);
  });
});

describe("isCatalogItem: rating", () => {
  it.each([0, 0.1, 2.5, 5])("accepts %s", (rating) => {
    expect(isCatalogItem(product({ rating }))).toBe(true);
  });

  it.each([
    ["just below zero", -0.0001],
    ["just above five", 5.0001],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a numeric string", "4"],
  ])("rejects a rating that is %s", (_label, rating) => {
    expect(isCatalogItem(product({ rating }))).toBe(false);
  });
});

describe("isCatalogItem: robustness", () => {
  it("accepts an object whose valid fields are inherited from a prototype", () => {
    // Pinned: property reads follow the prototype chain, so class instances
    // and Object.create() objects validate.
    const proto = product();
    expect(isCatalogItem(Object.create(proto))).toBe(true);
  });

  it("is a pure function of its input (repeat calls agree)", () => {
    const input = product();

    expect(isCatalogItem(input)).toBe(isCatalogItem(input));
  });

  it("filters mixed API payloads correctly", () => {
    const payload: unknown[] = [product(), { id: "x" }, null, service(), product({ numeric_price: 0 })];

    expect(payload.filter(isCatalogItem)).toHaveLength(2);
  });
});

describe("CatalogItem stays in sync with its guard", () => {
  // `satisfies` makes `tsc` fail when a field is added to or removed from
  // CatalogItem, so this fixture (and then the guard) must be updated.
  const TYPED_SHAPE = {
    id: "item_1",
    name: "Flat white",
    price: "$4.50",
    numeric_price: 4.5,
    description: "Smooth and strong",
    category: "Coffee",
    item_type: "product",
    duration_minutes: null,
    media: ["https://example.com/a.jpg"],
    is_popular: false,
    is_active: true,
    rating: 4.5,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  } satisfies CatalogItem;

  it("accepts a fully typed CatalogItem", () => {
    expect(isCatalogItem(TYPED_SHAPE)).toBe(true);
  });

  it("uses a test fixture with exactly the fields of CatalogItem", () => {
    expect(Object.keys(product()).sort()).toEqual(Object.keys(TYPED_SHAPE).sort());
  });

  it.each([...CATALOG_CATEGORIES])("accepts the official category %s", (category) => {
    expect(isCatalogItem(product({ category }))).toBe(true);
  });

  it("KNOWN GAP: does not restrict category to CATALOG_CATEGORIES", () => {
    // category is typed `string`, and the guard only checks typeof. If you
    // tighten it, flip this to expect false.
    expect(isCatalogItem(product({ category: "Soup" }))).toBe(true);
  });

  it("keeps the name limit at 160", () => {
    expect(CATALOG_NAME_MAX_LENGTH).toBe(160);
  });
});