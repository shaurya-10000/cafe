import { logFetchError } from "../lib/log";
import type { SupabaseClientLike } from "../types";

/** The business currency code, or `null` if unavailable. */
export async function fetchBusinessCurrency(
  supabase: SupabaseClientLike,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("currency")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    logFetchError("currency", error);
    return null;
  }

  return data?.currency ?? null;
}
