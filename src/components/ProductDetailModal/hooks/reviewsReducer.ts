import { REVIEWS_PAGE_SIZE } from "../constants";
import type { PublicReview, ReviewStats, ReviewsPage } from "../types";

export interface ReviewsState {
  stats: ReviewStats | null;
  statsLoading: boolean;
  reviews: PublicReview[];
  /** Server-side offset of the next page (rows received, not rows kept). */
  nextOffset: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
}

export type ReviewsAction =
  | { type: "reset" }
  | { type: "stats_loaded"; stats: ReviewStats }
  | { type: "first_page_loaded"; page: ReviewsPage }
  | { type: "first_page_failed"; message: string }
  | { type: "more_started" }
  | { type: "more_loaded"; page: ReviewsPage }
  | { type: "more_failed" };

export const initialReviewsState: ReviewsState = {
  stats: null,
  statsLoading: true,
  reviews: [],
  nextOffset: 0,
  hasMore: false,
  loading: true,
  error: null,
  loadingMore: false,
};

export function reviewsReducer(
  state: ReviewsState,
  action: ReviewsAction,
): ReviewsState {
  switch (action.type) {
    case "reset":
      return initialReviewsState;

    case "stats_loaded":
      return { ...state, stats: action.stats, statsLoading: false };

    case "first_page_loaded":
      return {
        ...state,
        reviews: action.page.reviews,
        nextOffset: action.page.rawCount,
        hasMore: action.page.rawCount === REVIEWS_PAGE_SIZE,
        loading: false,
        error: null,
      };

    case "first_page_failed":
      return { ...state, loading: false, error: action.message };

    case "more_started":
      return { ...state, loadingMore: true };

    case "more_loaded": {
      // A review inserted meanwhile shifts offsets; skip rows already shown.
      const seen = new Set(state.reviews.map((review) => review.id));
      const fresh = action.page.reviews.filter((review) => !seen.has(review.id));
      return {
        ...state,
        reviews: [...state.reviews, ...fresh],
        nextOffset: state.nextOffset + action.page.rawCount,
        hasMore: action.page.rawCount === REVIEWS_PAGE_SIZE,
        loadingMore: false,
      };
    }

    case "more_failed":
      return { ...state, loadingMore: false };

    default:
      return state;
  }
}
