import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const ALLOWED_CURRENCIES = new Set([
  "USD",
  "INR",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
]);

export interface SetStoreCurrencyResult {
  ok: boolean;
  currency?: string;
  error?: string;
}

export async function updateStoreCurrencyState(
  rawCurrency: string,
): Promise<SetStoreCurrencyResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Authentication required." };
  }

  const normalized = rawCurrency.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.has(normalized)) {
    return { ok: false, error: "Unsupported currency code." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, error: "Server configuration missing." };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const { error } = await supabaseAdmin
    .from("business_settings")
    .update({ currency: normalized })
    .eq("id", true);

  if (error) {
    console.error("[store] failed to update currency", error);
    return { ok: false, error: "Could not update store currency." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/customer");
  revalidatePath("/settings");

  return { ok: true, currency: normalized };
}