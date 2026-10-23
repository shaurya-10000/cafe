import { cx } from "../../lib/cx";
import { FOCUS_RING_CLASSES } from "../../styles";
import type { BusinessLocation } from "../../types";

interface CarouselDotsProps {
  locations: readonly BusinessLocation[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Mobile pagination; hidden from md upwards where arrows take over. */
export function CarouselDots({
  locations,
  activeIndex,
  onSelect,
}: CarouselDotsProps) {
  return (
    <div
      className="mt-8 flex justify-center gap-2 md:hidden"
      aria-label="Location pagination"
    >
      {locations.map((location, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={location.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Go to ${location.name}`}
            aria-current={isActive ? "true" : undefined}
            className={cx(
              "h-1.5 rounded-full transition-all",
              FOCUS_RING_CLASSES,
              isActive ? "w-6 bg-cafe-accent" : "w-1.5 bg-zinc-300 dark:bg-zinc-700",
            )}
          />
        );
      })}
    </div>
  );
}
