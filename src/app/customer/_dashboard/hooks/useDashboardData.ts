"use client";

import { useEffect } from "react";

import type { DashboardSupabaseClient, MountedRef } from "../types";
import { useBookings } from "./useBookings";
import { useDashboardRealtime } from "./useDashboardRealtime";
import { useFavorites } from "./useFavorites";
import { useOrders } from "./useOrders";

interface UseDashboardDataOptions {
  supabase: DashboardSupabaseClient;
  userId: string | undefined;
  isMountedRef: MountedRef;
}

/** Orders, favorites and bookings: initial load plus realtime refetch. */
export function useDashboardData({
  supabase,
  userId,
  isMountedRef,
}: UseDashboardDataOptions) {
  const options = { supabase, userId, isMountedRef };

  const { orders, loading, fetchOrders } = useOrders(options);
  const { favorites, favLoading, favError, fetchFavorites, removeFavorite } =
    useFavorites(options);
  const { bookings, fetchBookings } = useBookings(options);

  useEffect(() => {
    if (!userId) return;

    void fetchOrders();
    void fetchFavorites();
    void fetchBookings();
  }, [userId, fetchOrders, fetchFavorites, fetchBookings]);

  useDashboardRealtime({
    supabase,
    userId,
    onOrdersChange: fetchOrders,
    onFavoritesChange: fetchFavorites,
    onBookingsChange: fetchBookings,
  });

  return {
    orders,
    loading,
    favorites,
    favLoading,
    favError,
    removeFavorite,
    bookings,
    fetchBookings,
  };
}