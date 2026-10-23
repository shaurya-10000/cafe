import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import {
  EMPTY_REVIEW_STATS,
  fetchReviewStats,
  fetchReviewsPage,
} from "../api/reviewsApi";
import { REVIEWS_ERROR_MESSAGE } from "../constants";
import { initialReviewsState, reviewsReducer } from "./reviewsReducer";

/** Review stats plus paginated reviews for one catalog item. */
export function useReviews(itemId: string) {
  const supabase = useSupabaseClient();
  const [state, dispatch] = useReducer(reviewsReducer, initialReviewsState);

  // Which item the in-flight work belongs to; null once the effect is torn
  // down, so a slow "load more" can never land in another item's list.
  const activeItemRef = useRef<string | null>(itemId);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    activeItemRef.current = itemId;
    loadingMoreRef.current = false;
    dispatch({ type: "reset" });

    let cancelled = false;

    fetchReviewStats(supabase, itemId)
      .catch((error: unknown) => {
        // Stats are decorative; fall back to "no reviews" rather than error.
        console.error("[ProductDetailModal] review stats fetch failed", error);
        return EMPTY_REVIEW_STATS;
      })
      .then((stats) => {
        if (!cancelled) dispatch({ type: "stats_loaded", stats });
      });

    fetchReviewsPage(supabase, itemId, 0)
      .then((page) => {
        if (!cancelled) dispatch({ type: "first_page_loaded", page });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[ProductDetailModal] reviews fetch failed", error);
        dispatch({ type: "first_page_failed", message: REVIEWS_ERROR_MESSAGE });
      });

    return () => {
      cancelled = true;
      activeItemRef.current = null;
    };
  }, [itemId, supabase]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    dispatch({ type: "more_started" });

    try {
      const page = await fetchReviewsPage(supabase, itemId, state.nextOffset);
      if (activeItemRef.current !== itemId) return;
      dispatch({ type: "more_loaded", page });
    } catch (error) {
      console.error("[ProductDetailModal] load-more reviews failed", error);
      if (activeItemRef.current === itemId) dispatch({ type: "more_failed" });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [itemId, supabase, state.nextOffset]);

  return { ...state, loadMore };
}
