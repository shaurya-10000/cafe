import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SWIPE_THRESHOLD_PX } from "../../constants";
import { cx } from "../../lib/cx";
import { getSlideMotion } from "../../lib/motion";
import type {
  BusinessLocation,
  SlideDirection,
  TabPanelAttributes,
} from "../../types";
import { LocationDetails } from "../details/LocationDetails";
import { LocationMap } from "../map/LocationMap";

interface LocationSlideProps {
  location: BusinessLocation;
  isPriority: boolean;
  /** True when there is more than one location to swipe between. */
  hasSiblings: boolean;
  panel?: TabPanelAttributes;
  onSwipe: (direction: SlideDirection) => void;
}

/**
 * One animated slide. Mounted with key={location.id} by the carousel, so the
 * map and image state reset naturally whenever the location changes.
 */
export function LocationSlide({
  location,
  isPriority,
  hasSiblings,
  panel,
  onSwipe,
}: LocationSlideProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [isDragging, setIsDragging] = useState(false);
  const isSwipeable = hasSiblings && !shouldReduceMotion;

  return (
    <motion.div
      {...getSlideMotion(shouldReduceMotion)}
      drag={isSwipeable ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      style={{ touchAction: "pan-y" }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        if (info.offset.x < -SWIPE_THRESHOLD_PX) onSwipe("next");
        else if (info.offset.x > SWIPE_THRESHOLD_PX) onSwipe("prev");
      }}
      className={cx(
        "grid min-h-[420px] grid-cols-1 items-stretch gap-12 lg:grid-cols-2",
        isSwipeable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <LocationDetails
        location={location}
        isPriority={isPriority}
        panel={panel}
      />
      <LocationMap location={location} isDragging={isDragging} />
    </motion.div>
  );
}
