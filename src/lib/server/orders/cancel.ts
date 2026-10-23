import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";

import { errorMessage } from "@/lib/server/admin/errors";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import type { CancelPendingOrderResult } from "./types";

/**
 * Lets a customer abandon their own unpaid order (e.g. they left Stripe
 * Checkout). Idempotent: a missing, already-declined, already-refunded or
 * already-paid order is reported as success.
 */
export async function cancelOrderIfUnpaid(
  orderId: string,
): Promise<CancelPendingOrderResult> {
  const { userId } = await auth();

  if (!userId) return { success: false, error: "Not signed in." };

  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, is_paid, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) return { success: true };

    if (order.user_id !== String(userId)) {
      return { success: false, error: "Not authorized to cancel this order." };
    }

    if (order.is_paid) return { success: true, alreadyPaid: true };

    if (order.status === "declined" || order.status === "refunded") {
      return { success: true };
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: "declined" })
      .eq("id", orderId)
      .eq("is_paid", false);

    if (updateError) {
      console.error(
        "[adminActions] cancel pending order failed",
        { orderId, code: updateError.code },
        updateError,
      );

      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("[adminActions] cancel pending order threw", { orderId }, err);

    return { success: false, error: errorMessage(err) };
  }
}
