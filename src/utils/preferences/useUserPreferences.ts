"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";

export type PreferredOrderType = "pickup" | "delivery";
export type PreferredPaymentMethod = "online" | "in_person";

export interface UserPreferences {
  readonly phone: string | null;
  readonly address: string | null;
  readonly default_order_type: PreferredOrderType | null;
  readonly default_payment_method: PreferredPaymentMethod | null;
}

const EMPTY_PREFERENCES: UserPreferences = {
  phone: null,
  address: null,
  default_order_type: null,
  default_payment_method: null,
};

const COLUMNS = "phone,address,default_order_type,default_payment_method";

const ORDER_TYPES: readonly PreferredOrderType[] = ["pickup", "delivery"];
const PAYMENT_METHODS: readonly PreferredPaymentMethod[] = [
  "online",
  "in_person",
];

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.find((item) => item === value) ?? null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function normalizeRow(row: Record<string, unknown> | null): UserPreferences {
  if (!row) return EMPTY_PREFERENCES;
  return {
    phone: text(row.phone),
    address: text(row.address),
    default_order_type: pick(row.default_order_type, ORDER_TYPES),
    default_payment_method: pick(row.default_payment_method, PAYMENT_METHODS),
  };
}

interface PreferencesResult {
  readonly userId: string;
  readonly preferences: UserPreferences;
}

/**
 * Loads and saves the signed-in user's saved details and order defaults
 * (public.user_preferences). `preferences` is null only while loading; a
 * failed load resolves to empty preferences so callers never wait forever.
 */
export function useUserPreferences(userId: string | null) {
  const supabase = useSupabaseClient();
  const [result, setResult] = useState<PreferencesResult | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select(COLUMNS)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        if (!cancelled) {
          setResult({ userId, preferences: normalizeRow(data) });
        }
      } catch (error: unknown) {
        if (cancelled) return;
        console.error("[user-preferences] load failed", { userId }, error);
        setResult({ userId, preferences: EMPTY_PREFERENCES });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const current = userId !== null && result?.userId === userId ? result : null;

  /** Resolves to an error message, or null when the save succeeded. */
  const save = useCallback(
    async (patch: Partial<UserPreferences>): Promise<string | null> => {
      if (!userId) return "You need to be signed in.";

      try {
        const { error } = await supabase
          .from("user_preferences")
          .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });

        if (error) throw error;
      } catch (error: unknown) {
        console.error("[user-preferences] save failed", { userId }, error);
        return "Couldn\u2019t save. Please try again.";
      }

      setResult((previous) => ({
        userId,
        preferences: {
          ...(previous && previous.userId === userId
            ? previous.preferences
            : EMPTY_PREFERENCES),
          ...patch,
        },
      }));
      return null;
    },
    [supabase, userId],
  );

  return {
    preferences: current?.preferences ?? null,
    loading: userId !== null && current === null,
    save,
  };
}
