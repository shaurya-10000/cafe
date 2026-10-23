import { REVIEWS_PAGE_SIZE } from "../constants";
import {
  isValidReviewRow,
  isValidStatsRow,
  mapReviewRow,
  mapStatsRow,
} from "../lib/validators";
import type { ReviewStats, ReviewsPage, SupabaseClient } from "../types";

/**
 * DATA NOTES
 *
 * These read catalog_item_review_stats / catalog_item_public_reviews (Part C,
 * section 5 of the migration set), NOT the raw `reviews` table. The views
 * exist so the modal works for signed-out visitors: `reviews` itself is only
 * granted to `authenticated`, even though its RLS (`reviews_public_read`) is
 * `using(true)`, so a plain `.from("reviews")` read would silently fail for
 * guests.
 */

export const EMPTY_REVIEW_STATS: ReviewStats = {
  reviewCount: 0,
  averageRating: null,
};

/**
 * No row means no reviews yet, which is a normal state for a group-by view,
 * not an error. Throws the raw Supabase error on a real failure.
 */
export async function fetchReviewStats(
  supabase: SupabaseClient,
  itemId: string,
): Promise<ReviewStats> {
  const { data, error } = await supabase
    .from("catalog_item_review_stats")
    .select("review_count, average_rating")
    .eq("catalog_item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  if (data && isValidStatsRow(data)) return mapStatsRow(data);
  return EMPTY_REVIEW_STATS;
}

/** One newest-first page. Throws the raw Supabase error on failure. */
export async function fetchReviewsPage(
  supabase: SupabaseClient,
  itemId: string,
  offset: number,
): Promise<ReviewsPage> {
  const { data, error } = await supabase
    .from("catalog_item_public_reviews")
    .select("id, rating, remark, created_at")
    .eq("catalog_item_id", itemId)
    .order("created_at", { ascending: false })
    .range(offset, offset + REVIEWS_PAGE_SIZE - 1);

  if (error) throw error;

  const rows: unknown[] = Array.isArray(data) ? data : [];
  return {
    reviews: rows.filter(isValidReviewRow).map(mapReviewRow),
    rawCount: rows.length,
  };
}
