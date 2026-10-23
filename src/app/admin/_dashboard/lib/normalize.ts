import type { AdminLocation } from "@/app/admin/components/Locationstab";

import type {
  BookingRow,
  OrderItemLine,
  OrderRow,
  OrderType,
  PaymentMethod,
} from "../types";

/* Rows come back from PostgREST as loosely typed JSON (NUMERIC columns can
 * arrive as strings, jsonb arrays can hold anything). Everything below
 * coerces that into the strict shapes the tabs expect, and drops rows that
 * cannot be made valid instead of letting them crash a renderer. */

export function isOrderType(value: unknown): value is OrderType {
  return value === "delivery" || value === "pickup" || value === "scheduled";
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "online" || value === "in_person";
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeItemLine(raw: unknown): OrderItemLine | null {
  if (!raw || typeof raw !== "object") return null;

  const r = raw as Record<string, unknown>;

  const item_id = typeof r.item_id === "string" ? r.item_id : null;
  const name = typeof r.name === "string" ? r.name : null;
  const product_name =
    typeof r.product_name === "string" ? r.product_name : null;

  if (!item_id && !name && !product_name) return null;

  return {
    item_id,
    name,
    product_name,
    quantity: toNumberOrNull(r.quantity),
    unit_price: toNumberOrNull(r.unit_price),
    line_total: toNumberOrNull(r.line_total),
  };
}

export function normalizeOrder(row: unknown): OrderRow | null {
  if (!row || typeof row !== "object") return null;

  const r = row as Record<string, unknown>;

  if (typeof r.id !== "string" || typeof r.created_at !== "string") {
    return null;
  }

  const itemsRaw = Array.isArray(r.items) ? r.items : [];
  const items = itemsRaw
    .map(normalizeItemLine)
    .filter((line): line is OrderItemLine => line !== null);

  return {
    id: r.id,
    created_at: r.created_at,
    status: typeof r.status === "string" ? r.status : "incoming",
    total_amount: toNumberOrNull(r.total_amount),
    total_price: toNumberOrNull(r.total_price),
    is_paid: r.is_paid === true,
    order_type: isOrderType(r.order_type) ? r.order_type : "pickup",
    payment_method: isPaymentMethod(r.payment_method)
      ? r.payment_method
      : "in_person",
    customer_name:
      typeof r.customer_name === "string" && r.customer_name.trim() !== ""
        ? r.customer_name.trim()
        : null,
    user_id: typeof r.user_id === "string" ? r.user_id : null,
    items,
  };
}

export function normalizeBooking(row: unknown): BookingRow | null {
  if (!row || typeof row !== "object") return null;

  const r = row as Record<string, unknown>;

  if (typeof r.id !== "string" || typeof r.created_at !== "string") {
    return null;
  }

  const location =
    r.business_locations && typeof r.business_locations === "object"
      ? (r.business_locations as { name?: unknown })
      : null;

  return {
    id: r.id,
    created_at: r.created_at,
    user_name: typeof r.user_name === "string" ? r.user_name : null,
    user_email: typeof r.user_email === "string" ? r.user_email : null,
    booking_date: typeof r.booking_date === "string" ? r.booking_date : null,
    booking_time: typeof r.booking_time === "string" ? r.booking_time : null,
    party_size: toNumberOrNull(r.party_size),
    status: typeof r.status === "string" ? r.status : null,
    special_requests:
      typeof r.special_requests === "string" ? r.special_requests : null,
    business_locations: location
      ? { name: typeof location.name === "string" ? location.name : null }
      : null,
  };
}

export function normalizeLocation(row: unknown): AdminLocation | null {
  if (!row || typeof row !== "object") return null;

  const r = row as Record<string, unknown>;

  if (
    typeof r.id !== "string" ||
    typeof r.name !== "string" ||
    typeof r.address !== "string" ||
    typeof r.latitude !== "number" ||
    typeof r.longitude !== "number" ||
    typeof r.timezone !== "string" ||
    typeof r.hours_weekday !== "string" ||
    typeof r.hours_weekend !== "string"
  ) {
    return null;
  }

  const maxCapacity = toNumberOrNull(r.max_capacity);
  const defaultDuration = toNumberOrNull(r.default_booking_duration_minutes);
  const displayOrder = toNumberOrNull(r.display_order);

  if (
    maxCapacity === null ||
    defaultDuration === null ||
    displayOrder === null
  ) {
    return null;
  }

  return {
    id: r.id,
    name: r.name,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    phone: typeof r.phone === "string" ? r.phone : null,
    timezone: r.timezone,
    hoursWeekday: r.hours_weekday,
    hoursWeekend: r.hours_weekend,
    imageUrl: typeof r.image_url === "string" ? r.image_url : null,
    maxCapacity,
    defaultBookingDurationMinutes: defaultDuration,
    displayOrder,
    isActive: r.is_active === true,
  };
}
