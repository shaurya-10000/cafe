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
          <CarouselArrows onStep={onStep} />
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
