import { Loader2 } from "lucide-react";
import { useReviews } from "../../hooks/useReviews";
import { cx } from "../../lib/cx";
import { FOCUS_RING } from "../../styles";
import { ReviewItem } from "./ReviewItem";
import { ReviewsHeader } from "./ReviewsHeader";
import { ReviewsEmpty, ReviewsError, ReviewsLoading } from "./ReviewsStates";

interface ReviewsSectionProps {
  readonly itemId: string;
}

/** Self-contained: owns its own fetching, so the modal shell stays dumb. */
export function ReviewsSection({ itemId }: ReviewsSectionProps) {
  const {
    stats,
    statsLoading,
    reviews,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
  } = useReviews(itemId);

  return (
    <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <ReviewsHeader stats={stats} statsLoading={statsLoading} />

      {loading ? (
        <ReviewsLoading />
      ) : error ? (
        <ReviewsError message={error} />
      ) : reviews.length === 0 ? (
        <ReviewsEmpty />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      )}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className={cx(
            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cafe-accent hover:underline disabled:opacity-60",
            FOCUS_RING,
          )}
        >
          {loadingMore && (
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          )}
          Load More Reviews
        </button>
      )}
    </div>
  );
}
