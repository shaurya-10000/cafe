import { memo } from "react";

import { Quote } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Testimonial } from "../types";
import { StarRating } from "./StarRating";

interface TestimonialCardProps {
  readonly testimonial: Testimonial;
  readonly isDuplicate?: boolean;
}

export const TestimonialCard = memo(function TestimonialCard({
  testimonial,
  isDuplicate = false,
}: TestimonialCardProps) {
  return (
    <article
      aria-hidden={isDuplicate ? true : undefined}
      className={cn(
        "group flex w-[85vw] shrink-0 flex-col justify-between",
        "space-y-8 rounded-card border border-cafe-border",
        "bg-cafe-fg/[0.03] p-8",
        "transition-colors duration-300 hover:border-cafe-accent/40",
        "md:w-[380px] md:p-10",
        "motion-reduce:transition-none",
      )}
    >
      <div className="space-y-6 text-left">
        <div className="flex items-start justify-between">
          <Quote
            size={40}
            aria-hidden="true"
            className={cn(
              "text-cafe-accent/20",
              "transition-colors",
              "group-hover:text-cafe-accent/40",
              "motion-reduce:transition-none",
            )}
          />

          <StarRating rating={testimonial.rating} />
        </div>

        <p className="select-text text-base font-medium leading-relaxed text-cafe-fg/70 md:text-lg">
          &ldquo;{testimonial.text}&rdquo;
        </p>
      </div>

      <div className="space-y-1 border-t border-cafe-border pt-6 text-left">
        <p className="text-sm font-black uppercase tracking-tight text-cafe-fg">
          {testimonial.name}
        </p>

        {testimonial.date && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cafe-fg/50">
            {testimonial.date}
          </p>
        )}
      </div>
    </article>
  );
});
