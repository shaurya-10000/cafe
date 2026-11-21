import {
  HARD_MAX_PARTY_SIZE,
  MAX_PARTY_SIZE,
  MIN_PARTY_SIZE,
} from "../constants";
import type { BusinessSettings, SupabaseClientLike } from "../types";

/**
 * Reads the anonymous-visible storefront settings view. Falls back to the
 * compile-time defaults if the view is missing (e.g. a very old deploy).
 */
export async function fetchBusinessSettings(
  supabase: SupabaseClientLike,
): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from("business_public_settings")
    .select("business_name, max_party_size, is_open")
    .maybeSingle();

  if (error) throw error;

  const raw = (data ?? {}) as {
    business_name?: string | null;
    max_party_size?: number | null;
    is_open?: boolean | null;
  };

  const parsedMax = Number(raw.max_party_size);

  return {
    businessName: raw.business_name ?? null,
    isOpen: raw.is_open !== false,
    maxPartySize:
      Number.isFinite(parsedMax) && parsedMax >= MIN_PARTY_SIZE
        ? Math.min(Math.floor(parsedMax), HARD_MAX_PARTY_SIZE)
        : MAX_PARTY_SIZE,
  };
}
