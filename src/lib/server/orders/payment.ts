import { revalidatePath } from "next/cache";

import { assertIsAdmin } from "@/lib/server/admin/assertIsAdmin";
import { errorMessage } from "@/lib/server/admin/errors";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import type { ActionOutcome } from "./types";

/** true: the ledger has a settled, non-refundable payment for the order. */
async function hasSettledPayment(orderId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("order_payments")
    .select("id")
    .eq("order_id", orderId)
    .in("status", ["paid", "partially_refunded"])
    .eq("refund_due", false)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

/** true: the ledger has a refunded amount for the order. */
async function hasRefund(orderId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("order_payments")
    .select("id")
    .eq("order_id", orderId)
    .gt("amount_refunded", 0)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

/**
 * Manually toggles the is_paid flag on an order.
 *
 * The DB guards BOTH false -> true (requires a settled payment) and
 * true -> false (requires a refunded payment). This action runs through the
 * service-role client, which bypasses those DB triggers entirely, so the
 * same checks are replicated here for online orders.
 */
export async function setOrderPaymentState(
  orderId: string,
  isPaid: boolean,
): Promise<ActionOutcome> {
  try {
    await assertIsAdmin();
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }

  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, payment_method")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!order) return { success: false, error: "Order not found." };

    if (order.payment_method === "online") {
      if (isPaid) {
        if (!(await hasSettledPayment(orderId))) {
          return {
            success: false,
            error:
              "Online orders are marked paid by Stripe payments only. " +
              "No settled payment exists for this order.",
          };
        }
      } else if (!(await hasRefund(orderId))) {
        return {
          success: false,
          error:
            "Cannot un-mark an online order as unpaid: no refunded payment exists for this order.",
        };
      }
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ is_paid: isPaid })
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error(
      "[adminActions] payment toggle failed",
      { orderId, isPaid },
      err,
    );

    return { success: false, error: errorMessage(err) };
  }
}
