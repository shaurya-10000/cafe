import { useCallback, useState } from "react";
import type { BusinessLocation, SlideDirection } from "../types";

/**
 * Owns which location is active and which one was flagged as "nearest".
 * Resets to the first location whenever the list itself changes.
 */
export function useLocationSelection(locations: readonly BusinessLocation[]) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [nearestId, setNearestId] = useState<string | null>(null);


  // Reset when the list itself changes. Adjusting state during render (guarded
  // by the previous value) replaces the effect that used to do this.
  const [previousLocations, setPreviousLocations] = useState(locations);
  if (previousLocations !== locations) {
    setPreviousLocations(locations);
    setActiveIndex(0);
    setNearestId(null);
  }

  const selectIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= locations.length || index === activeIndex) {
        return;
      }
      setActiveIndex(index);
      setNearestId(null);
    },
    [activeIndex, locations.length],
  );

  const selectById = useCallback(
    (locationId: string) => {
      const index = locations.findIndex((l) => l.id === locationId);
      if (index === -1) return;
      setActiveIndex(index);
      setNearestId(null);
    },
    [locations],
  );

  const selectNearest = useCallback(
    (locationId: string) => {
      const index = locations.findIndex((l) => l.id === locationId);
      if (index !== -1) setActiveIndex(index);
      setNearestId(locationId);
    },
    [locations],
  );

  const step = useCallback(
    (direction: SlideDirection) => {
      if (locations.length < 2) return;
      const nextIndex =
        direction === "next"
          ? (activeIndex + 1) % locations.length
          : (activeIndex - 1 + locations.length) % locations.length;
      selectIndex(nextIndex);
    },
    [activeIndex, locations.length, selectIndex],
  );

  return {
    activeIndex,
    activeLocation: locations[activeIndex] ?? null,
    nearestId,
    selectIndex,
    selectById,
    selectNearest,
    step,
  };
}
