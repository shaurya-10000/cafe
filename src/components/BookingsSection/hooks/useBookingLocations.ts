import { useCallback, useEffect, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchActiveLocations } from "../api/locations";
import { fetchBusinessSettings } from "../api/settings";
import {
  DEFAULT_BUSINESS_SETTINGS,
  LOCATIONS_RETRY_DELAY_MS,
} from "../constants";
import type { BusinessSettings, Location, LocationsStatus } from "../types";
import { useIsMounted } from "./useIsMounted";

export interface UseBookingLocationsResult {
  locations: Location[];
  status: LocationsStatus;
  settings: BusinessSettings;
  retry: () => void;
}

/** Loads active locations + business settings, with one automatic retry. */
export function useBookingLocations(): UseBookingLocationsResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const [locations, setLocations] = useState<Location[]>([]);
  const [status, setStatus] = useState<LocationsStatus>("loading");
  const [settings, setSettings] = useState<BusinessSettings>(
    DEFAULT_BUSINESS_SETTINGS,
  );
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async (attempt: number): Promise<void> => {
      setStatus("loading");

      try {
        const [locationsData, settingsData] = await Promise.all([
          fetchActiveLocations(supabase),
          fetchBusinessSettings(supabase).catch((error: unknown) => {
            // Settings are non-fatal: log and fall back to defaults.
            console.warn("[bookings] business_public_settings unavailable", {
              stage: "fetch_settings",
              error,
            });

            return DEFAULT_BUSINESS_SETTINGS;
          }),
        ]);

        if (cancelled || !isMounted()) return;

        setSettings(settingsData);
        setLocations(locationsData);
        setStatus(locationsData.length > 0 ? "ready" : "empty");
      } catch (error) {
        console.error("[bookings] fetch failed", {
          stage: "fetch_locations",
          attempt,
          error,
        });

        if (cancelled || !isMounted()) return;

        if (attempt === 0) {
          retryTimer = setTimeout(() => void load(1), LOCATIONS_RETRY_DELAY_MS);
          return;
        }

        setStatus("error");
      }
    };

    void load(0);

    return () => {
      cancelled = true;

      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isMounted, reloadToken, supabase]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  return { locations, status, settings, retry };
}
