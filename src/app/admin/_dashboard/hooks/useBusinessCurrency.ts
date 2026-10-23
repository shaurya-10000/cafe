import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchBusinessCurrency } from "../api/settings";
import { DEFAULT_CURRENCY } from "../constants";
import { useIsMounted } from "./useIsMounted";

export function useBusinessCurrency(): string {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      const value = await fetchBusinessCurrency(supabase);

      if (cancelled || !isMounted() || !value) return;

      setCurrency(value);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isMounted, supabase]);

  return currency;
}
