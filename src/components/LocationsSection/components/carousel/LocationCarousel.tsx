import { AnimatePresence } from "framer-motion";
import type {
  BusinessLocation,
  SlideDirection,
  TabPanelAttributes,
} from "../../types";
import { CarouselArrows } from "./CarouselArrows";
import { CarouselDots } from "./CarouselDots";
import { LocationSlide } from "./LocationSlide";

interface LocationCarouselProps {
  locations: readonly BusinessLocation[];
  activeIndex: number;
  activeLocation: BusinessLocation;
  panel?: TabPanelAttributes;
  onSelectIndex: (index: number) => void;
  onStep: (direction: SlideDirection) => void;
}

export function LocationCarousel({
  locations,
  activeIndex,
  activeLocation,
  panel,
  onSelectIndex,
  onStep,
}: LocationCarouselProps) {
  const hasSiblings = locations.length > 1;

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        <LocationSlide
          key={activeLocation.id}
          location={activeLocation}
          isPriority={activeIndex === 0}
          hasSiblings={hasSiblings}
          panel={panel}
          onSwipe={onStep}
        />
      </AnimatePresence>

      {hasSiblings && (
        <>
          {/* 
            The wrapper is now full height (inset-0) and centers the arrows 
            vertically based on the entire content block. 
            On large screens, it pushes them out to the margins (-left-16).
          */}
          <div className="pointer-events-none absolute inset-0 z-30 hidden md:block">
            <div className="relative h-full w-full pointer-events-auto">
              <CarouselArrows onStep={onStep} />
            </div>
          </div>

          <CarouselDots
            locations={locations}
            activeIndex={activeIndex}
            onSelect={onSelectIndex}
          />
        </>
      )}
    </div>
  );
}
