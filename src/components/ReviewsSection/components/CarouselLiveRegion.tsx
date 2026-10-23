import { memo } from "react";

interface CarouselLiveRegionProps {
  /** Zero-based. */
  activeIndex: number;
  total: number;
}

/** Polite announcement of the approximate visible card. */
export const CarouselLiveRegion = memo(function CarouselLiveRegion({
  activeIndex,
  total,
}: CarouselLiveRegionProps) {
  const position = total > 0 ? (activeIndex % total) + 1 : 0;

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {`Showing testimonial ${position} of ${total}`}
    </p>
  );
});
