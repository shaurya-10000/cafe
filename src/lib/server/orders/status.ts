import { revalidatePath } from "next/cache";

import { isOrderStatus } from "@/lib/ai/constants";
import { assertIsAdmin } from "@/lib/server/admin/assertIsAdmin";
import { errorMessage } from "@/lib/server/admin/errors";
import { supabaseAdmin } from "@/lib/server/admin/supabaseAdmin";

import type { ActionOutcome } from "./types";

export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionOutcome> {
  try {
    await assertIsAdmin();
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }

  const normalized = status.toLowerCase();

  if (!isOrderStatus(normalized)) {
    return {
      success: false,
      error: `"${status}" is not a valid order status.`,
    };
  }

  try {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: normalized })
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error(
      "[adminActions] order status update failed",
      { orderId, status: normalized },
      err,
    );

    return { success: false, error: errorMessage(err) };
  }
}
