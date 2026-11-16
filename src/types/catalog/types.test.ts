import { describe, expect, expectTypeOf, it } from "vitest";

import {
  CATALOG_CATEGORIES,
  CATALOG_MAX_GALLERY_IMAGES,
  CATALOG_MAX_UPLOAD_MB,
  CATALOG_MEDIA_BUCKET,
  CATALOG_NAME_MAX_LENGTH,
} from "./types";
import type {
  CatalogAction,
  CatalogCategory,
  CatalogItem,
  CatalogItemType,
  MenuFilterData,
} from "./types";

type ActionOf<T extends CatalogAction["type"]> = Extract<CatalogAction, { type: T }>;

// Compile-time exhaustiveness: adding an action to the union without
// updating this switch fails the type-check.
function assertNever(value: never): never {
  throw new Error(`Unhandled catalog action: ${JSON.stringify(value)}`);
}

function describeAction(action: CatalogAction): string {
  switch (action.type) {
    case "FILTER_MENU":
      return "filter";
    case "OPEN_DIRECTIONS":
      return "directions";
    case "OPEN_CONTACT":
      return "contact";
    default:
      return assertNever(action);
  }
}

// Used only for compile-time checks of invalid literals below.
function accept(_action: CatalogAction): void {}

const PRODUCT: CatalogItem = {
  id: "item-1",
  name: "Flat White",
  price: "$4.50",
  numeric_price: 4.5,
  description: null,
  category: "Coffee",
  item_type: "product",
  duration_minutes: null,
  media: [],
  is_popular: true,
  is_active: true,
  rating: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("catalog constants (runtime)", () => {
  it("lists the four known categories in display order", () => {
    expect([...CATALOG_CATEGORIES]).toEqual(["Coffee", "Signature", "Pastry", "Cold"]);
  });

  it("has unique, non-empty, trimmed category names", () => {
    expect(new Set(CATALOG_CATEGORIES).size).toBe(CATALOG_CATEGORIES.length);

    for (const category of CATALOG_CATEGORIES) {
      expect(category.length).toBeGreaterThan(0);
      expect(category).toBe(category.trim());
    }
  });

  it("uses a storage-safe media bucket name", () => {
    expect(CATALOG_MEDIA_BUCKET).toBe("catalog-media");
    expect(CATALOG_MEDIA_BUCKET).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
  });

  it.each([
    ["CATALOG_NAME_MAX_LENGTH", CATALOG_NAME_MAX_LENGTH, 160],
    ["CATALOG_MAX_GALLERY_IMAGES", CATALOG_MAX_GALLERY_IMAGES, 4],
    ["CATALOG_MAX_UPLOAD_MB", CATALOG_MAX_UPLOAD_MB, 5],
  ])("%s is a positive integer with the agreed value", (_name, actual, expected) => {
    expect(Number.isInteger(actual)).toBe(true);
    expect(actual).toBeGreaterThan(0);
    expect(actual).toBe(expected);
  });

  it("keeps the upload size limit and gallery size sensible together", () => {
    expect(CATALOG_MAX_GALLERY_IMAGES * CATALOG_MAX_UPLOAD_MB).toBeLessThanOrEqual(50);
  });
});

describe("catalog types - item", () => {
  it("restricts CatalogItemType to product | service", () => {
    expectTypeOf<CatalogItemType>().toEqualTypeOf<"product" | "service">();
  });

  it("derives CatalogCategory from the constant tuple", () => {
    expectTypeOf(CATALOG_CATEGORIES).toEqualTypeOf<
      readonly ["Coffee", "Signature", "Pastry", "Cold"]
    >();
    expectTypeOf<CatalogCategory>().toEqualTypeOf<"Coffee" | "Signature" | "Pastry" | "Cold">();
  });

  it("defines the exact CatalogItem shape", () => {
    expectTypeOf<CatalogItem>().toEqualTypeOf<{
      id: string;
      name: string;
      price: string;
      numeric_price: number;
      description: string | null;
      category: string;
      item_type: CatalogItemType;
      duration_minutes: number | null;
      media: string[];
      is_popular: boolean;
      is_active: boolean;
      rating: number | null;
      created_at: string;
      updated_at: string;
    }>();
  });

  it("keeps nullable fields required-but-nullable, not optional", () => {
    expectTypeOf<CatalogItem["description"]>().toEqualTypeOf<string | null>();
    expectTypeOf<CatalogItem["duration_minutes"]>().toEqualTypeOf<number | null>();
    expectTypeOf<CatalogItem["rating"]>().toEqualTypeOf<number | null>();
  });

  it("accepts a product and a timed service", () => {
    const service: CatalogItem = {
      ...PRODUCT,
      id: "svc-1",
      item_type: "service",
      duration_minutes: 45,
      media: ["a.png", "b.png"],
      rating: 4.8,
      description: "Barista class",
    };

    expect([PRODUCT, service].map((item) => item.item_type)).toEqual(["product", "service"]);
  });

  it("rejects invalid items at compile time", () => {
    // @ts-expect-error item_type must be product | service
    const badType: CatalogItem = { ...PRODUCT, item_type: "bundle" };
    // @ts-expect-error description cannot be undefined
    const badDescription: CatalogItem = { ...PRODUCT, description: undefined };
    // @ts-expect-error media must be an array of strings
    const badMedia: CatalogItem = { ...PRODUCT, media: "a.png" };
    // @ts-expect-error numeric_price must be a number
    const badPrice: CatalogItem = { ...PRODUCT, numeric_price: "4.5" };
    // @ts-expect-error unknown category
    const badCategory: CatalogCategory = "Tea";

    expect([badType, badDescription, badMedia, badPrice, badCategory]).toHaveLength(5);
  });
});

describe("catalog types - MenuFilterData", () => {
  it("makes every filter optional and typed", () => {
    expectTypeOf<MenuFilterData>().toEqualTypeOf<{
      category?: string;
      maxPrice?: number;
      dietary?: string[];
      search?: string;
    }>();

    const empty: MenuFilterData = {};
    const full: MenuFilterData = {
      category: "Coffee",
      maxPrice: 6,
      dietary: ["vegan"],
      search: "latte",
    };
    expect([empty, full]).toHaveLength(2);
  });
});

describe("catalog types - CatalogAction union", () => {
  it("contains exactly the three action types", () => {
    expectTypeOf<CatalogAction["type"]>().toEqualTypeOf<
      "FILTER_MENU" | "OPEN_DIRECTIONS" | "OPEN_CONTACT"
    >();
  });

  it("requires a string label on every action", () => {
    expectTypeOf<CatalogAction["label"]>().toEqualTypeOf<string>();
  });

  it("pairs each action with the right optional payload", () => {
    expectTypeOf<ActionOf<"FILTER_MENU">["data"]>().toEqualTypeOf<MenuFilterData | undefined>();
    expectTypeOf<ActionOf<"OPEN_DIRECTIONS">["data"]>().toEqualTypeOf<
      Record<string, never> | undefined
    >();
    expectTypeOf<ActionOf<"OPEN_CONTACT">["data"]>().toEqualTypeOf<
      Record<string, never> | undefined
    >();
  });

  it("narrows the payload by the discriminant", () => {
    const action = { type: "FILTER_MENU", label: "Filter" } as CatalogAction;

    if (action.type === "FILTER_MENU") {
      expectTypeOf(action.data).toEqualTypeOf<MenuFilterData | undefined>();
    }
    expect(action.type).toBe("FILTER_MENU");
  });

  it("accepts every action with and without a payload", () => {
    const actions: CatalogAction[] = [
      { type: "FILTER_MENU", label: "Filter" },
      { type: "FILTER_MENU", label: "Filter", data: { category: "Cold", maxPrice: 5 } },
      { type: "OPEN_DIRECTIONS", label: "Directions" },
      { type: "OPEN_DIRECTIONS", label: "Directions", data: {} },
      { type: "OPEN_CONTACT", label: "Contact" },
    ];

    expect(actions.map(describeAction)).toEqual([
      "filter",
      "filter",
      "directions",
      "directions",
      "contact",
    ]);
  });

  it("rejects invalid actions at compile time", () => {
    // Each directive must stay on the line that contains the error.
    // @ts-expect-error unknown action type
    accept({ type: "NOPE", label: "x" });
    // @ts-expect-error label is required
    accept({ type: "OPEN_CONTACT" });
    // @ts-expect-error label must be a string
    accept({ type: "OPEN_CONTACT", label: 1 });
    // @ts-expect-error OPEN_DIRECTIONS carries no payload fields
    accept({ type: "OPEN_DIRECTIONS", label: "x", data: { a: 1 } });
    // @ts-expect-error maxPrice must be a number
    accept({ type: "FILTER_MENU", label: "x", data: { maxPrice: "5" } });
    // @ts-expect-error dietary must be an array
    accept({ type: "FILTER_MENU", label: "x", data: { dietary: "vegan" } });
    // @ts-expect-error unknown filter key
    accept({ type: "FILTER_MENU", label: "x", data: { color: "red" } });

    expect(true).toBe(true);
  });
});