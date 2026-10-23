import { memo } from "react";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

import { STAR_COUNT } from "../constants";

interface StarRatingProps {
  rating: number;
}

export const StarRating = memo(function StarRating({ rating }: StarRatingProps) {
  return (
    <div
      className="flex gap-0.5 text-cafe-accent"
      role="img"
      aria-label={`Rated ${rating} out of ${STAR_COUNT} stars`}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const filled = index < rating;

        return (
          <Star
            key={index}
            size={12}
            aria-hidden="true"
            fill={filled ? "currentColor" : "none"}
            className={cn(filled ? "text-cafe-accent" : "text-cafe-fg/20")}
          />
        );
      })}
    </div>
  );
});
