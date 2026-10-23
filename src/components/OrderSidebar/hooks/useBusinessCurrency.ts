import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import { DEFAULT_CURRENCY } from "../constants";

/** Loads the business currency whenever the sidebar is open. */
export function useBusinessCurrency(enabled: boolean): string {
  const supabase = useSupabaseClient();

  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const { data } = await supabase
          .from("business_public_settings")
          .select("currency")
          .maybeSingle();

        if (cancelled) return;

        if (data?.currency) setCurrency(data.currency);
      } catch (error) {
        console.error("[OrderSidebar] currency fetch failed", error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, supabase]);

  return currency;
}
