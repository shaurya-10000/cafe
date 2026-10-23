import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import { fetchLocations } from "../api/fetchLocations";
import { classifyLoadError } from "../lib/errors";
import type { BusinessLocation, LoadErrorKind } from "../types";

export type LocationsState =
  | { status: "loading" }
  | { status: "error"; kind: LoadErrorKind }
  | { status: "ready"; locations: BusinessLocation[] };

type SettledState = Exclude<LocationsState, { status: "loading" }>;

const LOADING: LocationsState = { status: "loading" };

export function useLocations(): {
  state: LocationsState;
  reload: () => void;
} {
  const supabase = useSupabaseClient();
  const [reloadToken, setReloadToken] = useState(0);
  // The settled outcome, tagged with the request that produced it. A result
  // from an older request reads as "loading" again, so `reload()` shows the
  // loading state without setting state synchronously in the effect.
  const [result, setResult] = useState<{
    token: number;
    state: SettledState;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchLocations(supabase)
      .then((locations) => {
        if (!cancelled) {
          setResult({ token: reloadToken, state: { status: "ready", locations } });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[LocationsSection] failed to load locations", error);
        setResult({
          token: reloadToken,
          state: { status: "error", kind: classifyLoadError(error) },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const state: LocationsState =
    result !== null && result.token === reloadToken ? result.state : LOADING;

  return { state, reload };
}