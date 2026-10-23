import {
  memo,
  type CSSProperties,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type RefObject,
} from "react";

import { motion, type MotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

import type { Testimonial } from "../types";
import { EdgeFades } from "./EdgeFades";
import { TestimonialCard } from "./TestimonialCard";

interface TestimonialMarqueeProps {
  testimonials: readonly Testimonial[];
  describedBy: string;
  x: MotionValue<number>;
  regionRef: RefObject<HTMLDivElement | null>;
  firstSetRef: RefObject<HTMLDivElement | null>;
  duplicateSetRef: RefObject<HTMLDivElement | null>;
  dragEnabled: boolean;
  /** Fallback for browsers without `inert`. */
  duplicateStyle: CSSProperties | undefined;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: FocusEventHandler<HTMLDivElement>;
  onBlur: FocusEventHandler<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const TestimonialMarquee = memo(function TestimonialMarquee({
  testimonials,
  describedBy,
  x,
  regionRef,
  firstSetRef,
  duplicateSetRef,
  dragEnabled,
  duplicateStyle,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  onDragStart,
  onDragEnd,
}: TestimonialMarqueeProps) {
  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
      aria-describedby={describedBy}
      tabIndex={0}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={cn(
        "relative mt-16 w-full overflow-hidden py-4",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-inset focus-visible:ring-cafe-accent",
      )}
    >
      <EdgeFades />

      <motion.div
        style={{ x, touchAction: "pan-y" }}
        drag={dragEnabled ? "x" : false}
        dragDirectionLock
        dragMomentum
        dragElastic={0.08}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex w-max cursor-grab active:cursor-grabbing"
      >
        <div ref={firstSetRef} className="flex shrink-0 gap-6 pr-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>

        <div
          ref={duplicateSetRef}
          aria-hidden="true"
          tabIndex={-1}
          style={duplicateStyle}
          className="flex shrink-0 gap-6 pr-6"
        >
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={`duplicate-${testimonial.id}`}
              testimonial={testimonial}
              isDuplicate
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
});
