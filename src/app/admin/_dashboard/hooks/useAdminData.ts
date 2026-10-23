import { useCallback, useEffect, useState } from "react";

import type { AdminLocation } from "@/app/admin/components/Locationstab";
import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchBookings } from "../api/bookings";
import { fetchLocations } from "../api/locations";
import { fetchOrders } from "../api/orders";
import { REALTIME_CHANNEL, REALTIME_DEBOUNCE_MS } from "../constants";
import type { BookingRow, OrderRow } from "../types";
import { useDebouncedCallback } from "./useDebouncedCallback";
import { useIsMounted } from "./useIsMounted";

export interface UseAdminDataResult {
  orders: OrderRow[];
  bookings: BookingRow[];
  locations: AdminLocation[];
  /** Immediate (non-debounced) bookings refetch, e.g. after a status change. */
  refreshBookings: () => Promise<void>;
}

/**
 * Loads orders, bookings and locations, then keeps them fresh through a
 * single Supabase realtime channel. Bursts of events are debounced into one
 * refetch per table.
 */
export function useAdminData(): UseAdminDataResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);

  const loadOrders = useCallback(async (): Promise<void> => {
    const rows = await fetchOrders(supabase);

    if (!isMounted() || rows === null) return;

    setOrders(rows);
  }, [isMounted, supabase]);

  const loadBookings = useCallback(async (): Promise<void> => {
    const rows = await fetchBookings(supabase);

    if (!isMounted() || rows === null) return;

    setBookings(rows);
  }, [isMounted, supabase]);

  const loadLocations = useCallback(async (): Promise<void> => {
    const rows = await fetchLocations(supabase);

    if (!isMounted() || rows === null) return;

    setLocations(rows);
  }, [isMounted, supabase]);

  const debouncedLoadOrders = useDebouncedCallback(
    loadOrders,
    REALTIME_DEBOUNCE_MS,
  );
  const debouncedLoadBookings = useDebouncedCallback(
    loadBookings,
    REALTIME_DEBOUNCE_MS,
  );
  const debouncedLoadLocations = useDebouncedCallback(
    loadLocations,
    REALTIME_DEBOUNCE_MS,
  );

  useEffect(() => {
        // The loaders await the fetch before calling setState, so this is not a
    // synchronous setState-in-effect. The rule cannot see past the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void Promise.all([loadOrders(), loadBookings(), loadLocations()]);

    const channel = supabase
      .channel(REALTIME_CHANNEL)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => debouncedLoadOrders(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => debouncedLoadBookings(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_locations" },
        () => debouncedLoadLocations(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    supabase,
    loadOrders,
    loadBookings,
    loadLocations,
    debouncedLoadOrders,
    debouncedLoadBookings,
    debouncedLoadLocations,
  ]);

  return { orders, bookings, locations, refreshBookings: loadBookings };
}
