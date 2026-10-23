import { memo } from "react";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

import { STAR_COUNT } from "../constants";

interface AverageRatingBadgeProps {
  averageRating: string;
}

export const AverageRatingBadge = memo(function AverageRatingBadge({
  averageRating,
}: AverageRatingBadgeProps) {
  return (
    <div
      role="img"
      aria-label={`Average rating ${averageRating} out of ${STAR_COUNT}`}
      className={cn(
        "flex w-fit items-center gap-2 rounded-full",
        "border border-cafe-border bg-cafe-fg/5 px-4 py-2",
      )}
    >
      <div className="flex gap-1 text-cafe-accent" aria-hidden="true">
        {Array.from({ length: STAR_COUNT }, (_, index) => (
          <Star key={index} size={12} fill="currentColor" />
        ))}
      </div>

      <span className="text-[10px] font-black uppercase tracking-widest text-cafe-fg/60">
        {averageRating} Avg Rating
      </span>
    </div>
  );
});
