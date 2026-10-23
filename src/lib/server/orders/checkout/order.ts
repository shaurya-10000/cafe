import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import type { ProcessCheckoutInput } from "../types";
import type { PricedLine } from "./pricing";

export interface CreatedOrder {
  id: string;
  /** Computed by the DB from the coupon; 0 when none applies. */
  discount_amount: number;
}

export type InsertOrderResult =
  | { ok: true; order: CreatedOrder }
  | { ok: false; error: string };

interface InsertOrderArgs {
  userId: string;
  input: ProcessCheckoutInput;
  lines: readonly PricedLine[];
  couponId: string | null;
}

/**
 * Inserts the order. Totals are written as 0 on purpose: the database
 * triggers compute subtotal, discount and total from the catalog and the
 * coupon, so nothing the client sent can influence what is charged.
 */
export async function insertOrder({
  userId,
  input,
  lines,
  couponId,
}: InsertOrderArgs): Promise<InsertOrderResult> {
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert([
      {
        user_id: String(userId),
        customer_name: input.customerName,
        order_type: input.orderType,
        payment_method: input.paymentMethod,
        address: input.orderType === "delivery" ? input.address : "Pickup",
        phone: input.phone,
        coupon_id: couponId,
        subtotal_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        total_price: 0,
        status: "incoming",
        is_paid: false,
        items: lines.map(({ item_id, name, quantity }) => ({
          item_id,
          name,
          quantity,
        })),
      },
    ])
    .select()
    .single();

  if (orderError || !order) {
    // 23514 = check_violation, which `validate_order_integrity` raises when
    // the coupon becomes invalid mid-flight (expired, fully redeemed, or at
    // its per-user limit between cart and checkout).
    if (orderError?.code === "23514" && couponId) {
      return {
        ok: false,
        error: "Your coupon is no longer valid. Please remove it and try again.",
      };
    }

    console.error(
      "[adminActions] order insert failed",
      { userId, itemCount: lines.length, code: orderError?.code },
      orderError,
    );

    throw new Error(orderError?.message || "Failed to create order.");
  }

  return {
    ok: true,
    order: {
      id: String(order.id),
      discount_amount: Number(order.discount_amount) || 0,
    },
  };
}
