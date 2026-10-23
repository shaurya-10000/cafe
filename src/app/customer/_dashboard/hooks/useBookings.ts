"use client";

import { useCallback, useState } from "react";

import type { BookingRow, DashboardSupabaseClient, MountedRef } from "../types";

interface UseBookingsOptions {
  supabase: DashboardSupabaseClient;
  userId: string | undefined;
  isMountedRef: MountedRef;
}

export function useBookings({
  supabase,
  userId,
  isMountedRef,
}: UseBookingsOptions) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, business_locations(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!isMountedRef.current) return;
      if (data) setBookings(data as BookingRow[]);
    } catch (err) {
      console.error("[dashboard] bookings fetch failed", err);
    }
  }, [supabase, userId, isMountedRef]);

  return { bookings, fetchBookings };
}