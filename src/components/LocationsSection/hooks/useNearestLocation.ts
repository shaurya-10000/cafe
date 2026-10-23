import { useCallback, useState } from "react";
import { LOCATION_MAX_AGE_MS, LOCATION_TIMEOUT_MS } from "../constants";
import { findNearestLocation } from "../lib/geo";
import type { BusinessLocation, NearestLookupStatus } from "../types";
import { useIsMounted } from "./useIsMounted";

/**
 * User-initiated geolocation only, never on mount. With no structured hours
 * to filter by "open now", this simply picks the closest location.
 */
export function useNearestLocation(
  locations: readonly BusinessLocation[],
  onFound: (location: BusinessLocation) => void,
) {
  const isMounted = useIsMounted();
  const [status, setStatus] = useState<NearestLookupStatus>("idle");

  const detect = useCallback(() => {
    if (locations.length < 2 || status === "locating") return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted()) return;

        const { latitude, longitude } = position.coords;
        const target = findNearestLocation(locations, latitude, longitude);

        if (!target) {
          setStatus("unavailable");
          return;
        }

        onFound(target);
        setStatus("success");
      },
      (geolocationError) => {
        if (!isMounted()) return;
        console.warn(
          "[LocationsSection] geolocation unavailable",
          geolocationError,
        );
        setStatus("unavailable");
      },
      {
        enableHighAccuracy: false,
        maximumAge: LOCATION_MAX_AGE_MS,
        timeout: LOCATION_TIMEOUT_MS,
      },
    );
  }, [locations, status, onFound, isMounted]);

  return { status, detect };
}
