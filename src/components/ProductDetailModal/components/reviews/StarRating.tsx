import { Star } from "lucide-react";
import { cx } from "../../lib/cx";

interface StarRatingProps {
  readonly rating: number;
}

const STAR_SLOTS = [0, 1, 2, 3, 4] as const;

/** Five stars for the eye, plus a text equivalent for screen readers. */
export function StarRating({ rating }: StarRatingProps) {
  return (
    <>
      <div className="flex items-center" aria-hidden="true">
        {STAR_SLOTS.map((slot) => (
          <Star
            key={slot}
            size={12}
            fill="currentColor"
            className={cx(
              slot < rating
                ? "text-amber-500"
                : "text-zinc-300 dark:text-zinc-700",
            )}
          />
        ))}
      </div>
      <span className="sr-only">{rating} out of 5 stars</span>
    </>
  );
}
