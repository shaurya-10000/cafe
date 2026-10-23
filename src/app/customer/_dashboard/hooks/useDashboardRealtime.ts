"use client";

import { useEffect } from "react";

import type { DashboardSupabaseClient } from "../types";

interface UseDashboardRealtimeOptions {
  supabase: DashboardSupabaseClient;
  userId: string | undefined;
  onOrdersChange: () => void;
  onFavoritesChange: () => void;
  onBookingsChange: () => void;
}

/** One realtime channel for the user's orders, favorites and bookings. */
export function useDashboardRealtime({
  supabase,
  userId,
  onOrdersChange,
  onFavoritesChange,
  onBookingsChange,
}: UseDashboardRealtimeOptions): void {
  useEffect(() => {
    if (!userId) return;

    const filter = `user_id=eq.${userId}`;
    const channel = supabase.channel(`dashboard_updates_${userId}_${Date.now()}`);

    const subscribeTo = (table: string, handler: () => void) =>
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => handler(),
      );

    subscribeTo("orders", onOrdersChange);
    subscribeTo("favorites", onFavoritesChange);
    subscribeTo("bookings", onBookingsChange);

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, onOrdersChange, onFavoritesChange, onBookingsChange]);
}