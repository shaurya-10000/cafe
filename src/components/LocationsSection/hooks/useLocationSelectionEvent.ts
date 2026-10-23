import { useEffect } from "react";
import { SELECT_LOCATION_EVENT } from "../constants";

type SelectLocationEvent = CustomEvent<{ locationId?: unknown }>;

/** Lets external code (e.g. an AI concierge) switch the active location. */
export function useLocationSelectionEvent(
  onSelect: (locationId: string) => void,
): void {
  useEffect(() => {
    const handler = (event: Event) => {
      const locationId = (event as SelectLocationEvent).detail?.locationId;
      if (typeof locationId !== "string") return;
      onSelect(locationId);
    };

    window.addEventListener(SELECT_LOCATION_EVENT, handler);
    return () => window.removeEventListener(SELECT_LOCATION_EVENT, handler);
  }, [onSelect]);
}
