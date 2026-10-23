import { Star } from "lucide-react";
import type { ReviewStats } from "../../types";

interface ReviewsHeaderProps {
  readonly stats: ReviewStats | null;
  readonly statsLoading: boolean;
}

export function ReviewsHeader({ stats, statsLoading }: ReviewsHeaderProps) {
  const showStats = !statsLoading && stats !== null && stats.reviewCount > 0;

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
        Customer Reviews
      </h3>

      {showStats && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
          <Star
            size={12}
            className="text-amber-500"
            fill="currentColor"
            aria-hidden="true"
          />
          {stats.averageRating != null
            ? stats.averageRating.toFixed(1)
            : "\u2014"}
          <span className="font-medium text-zinc-400">
            ({stats.reviewCount})
          </span>
        </div>
      )}
    </div>
  );
}
