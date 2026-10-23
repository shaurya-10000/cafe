import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../lib/cx";
import { FOCUS_RING } from "../../styles";
import type { StepDirection } from "../../types";

interface GalleryControlsProps {
  readonly count: number;
  readonly activeIndex: number;
  readonly onStep: (direction: StepDirection) => void;
  readonly onSelect: (index: number) => void;
}

const ARROW_CLASSES =
  "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-transform hover:scale-105 dark:bg-black/70";

export function GalleryControls({
  count,
  activeIndex,
  onStep,
  onSelect,
}: GalleryControlsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onStep("prev")}
        aria-label="Previous image"
        className={cx(ARROW_CLASSES, "left-4", FOCUS_RING)}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onStep("next")}
        aria-label="Next image"
        className={cx(ARROW_CLASSES, "right-4", FOCUS_RING)}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`View image ${index + 1} of ${count}`}
            aria-current={activeIndex === index ? "true" : undefined}
            className={cx(
              "h-1.5 rounded-full transition-all",
              FOCUS_RING,
              activeIndex === index ? "w-6 bg-cafe-accent" : "w-1.5 bg-white/70",
            )}
          />
        ))}
      </div>
    </>
  );
}
