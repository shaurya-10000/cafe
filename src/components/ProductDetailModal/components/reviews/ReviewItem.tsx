import { ShieldCheck } from "lucide-react";
import { formatRelativeTime } from "../../lib/format";
import type { PublicReview } from "../../types";
import { StarRating } from "./StarRating";

interface ReviewItemProps {
  readonly review: PublicReview;
}

/**
 * No reviewer name is shown: reviews.user_id is a Clerk id with no
 * denormalized display name in this schema, and `profiles` RLS only lets you
 * read your OWN row, so nothing this component could query would resolve
 * someone else's name. "Verified Customer" is accurate, because the
 * reviews_owner_insert policy requires a completed order containing this
 * exact item.
 */
export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center gap-2">
        <StarRating rating={review.rating} />

        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <ShieldCheck size={10} aria-hidden="true" />
          Verified Customer
        </span>

        <span className="text-[10px] text-zinc-400">
          &middot; {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      {review.remark && (
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {review.remark}
        </p>
      )}
    </li>
  );
}
