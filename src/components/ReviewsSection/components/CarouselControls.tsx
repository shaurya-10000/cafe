import { memo } from "react";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

const BUTTON_CLASS_NAME = cn(
  "rounded-full p-2 text-cafe-fg/80 transition-colors",
  "hover:bg-cafe-fg/10",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
  "disabled:pointer-events-none disabled:opacity-40",
  "motion-reduce:transition-none",
);

interface CarouselControlsProps {
  canScroll: boolean;
  isPaused: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePause: () => void;
}

export const CarouselControls = memo(function CarouselControls({
  canScroll,
  isPaused,
  onPrevious,
  onNext,
  onTogglePause,
}: CarouselControlsProps) {
  return (
    <div
      role="group"
      aria-label="Testimonial carousel controls"
      className={cn(
        "flex items-center gap-1.5 rounded-full",
        "border border-cafe-border bg-cafe-fg/5 p-1",
      )}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canScroll}
        aria-label="Previous testimonial"
        className={BUTTON_CLASS_NAME}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onTogglePause}
        aria-label={
          isPaused
            ? "Play testimonial auto-scroll"
            : "Pause testimonial auto-scroll"
        }
        aria-pressed={isPaused}
        className={BUTTON_CLASS_NAME}
      >
        {isPaused ? (
          <Play size={16} aria-hidden="true" />
        ) : (
          <Pause size={16} aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canScroll}
        aria-label="Next testimonial"
        className={BUTTON_CLASS_NAME}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
});
