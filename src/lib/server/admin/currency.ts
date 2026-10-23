import { supabaseAdmin } from "./supabaseAdmin";

/** Lowercase ISO 4217 code from business_settings (what Stripe expects). */
export async function getBusinessCurrency(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .select("currency")
    .eq("id", true)
    .maybeSingle();

  if (error) throw new Error("Couldn't load business settings.");

  return (data?.currency || "usd").toLowerCase();
}
