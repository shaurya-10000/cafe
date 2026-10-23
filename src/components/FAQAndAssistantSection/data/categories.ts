import type { FAQCategory, FAQCategoryMeta } from "../types";

export const DEFAULT_CATEGORY_META: Readonly<
  Record<FAQCategory, FAQCategoryMeta>
> = {
  dining: { label: "Dining", blurb: "Menu, dietary, experience" },
  orders: { label: "Orders", blurb: "Cart, pickup, delivery" },
  reservations: { label: "Reservations", blurb: "Booking & policies" },
  visit: { label: "Visit", blurb: "Hours, location, parking" },
};

export const DEFAULT_CATEGORY_ORDER: readonly FAQCategory[] = [
  "dining",
  "orders",
  "reservations",
  "visit",
];
