import { memo } from "react";

import { cn } from "@/lib/utils";

interface ReviewsHeadingProps {
  labelId: string;
  descriptionId: string;
}

export const ReviewsHeading = memo(function ReviewsHeading({
  labelId,
  descriptionId,
}: ReviewsHeadingProps) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cafe-accent">
        Community Voice
      </p>

      <h2
        id={labelId}
        className={cn(
          "text-6xl font-black uppercase",
          "leading-[0.8] tracking-tighter text-cafe-fg md:text-8xl",
        )}
      >
        The{" "}
        <span className="font-serif lowercase italic text-cafe-accent">
          Feedback
        </span>{" "}
        <br />
        Loop.
      </h2>

      <p id={descriptionId} className="sr-only">
        Customer testimonials. Use the Previous and Next buttons, or the left
        and right arrow keys, to move between testimonials. Home and End jump
        to the first and last. Automatic scrolling pauses while these controls
        have focus.
      </p>
    </div>
  );
});
