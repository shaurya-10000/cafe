"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { useSupabaseClient } from "@/utils/supabase/client";

import {
  DashboardFallback,
  DashboardHeader,
  ErrorBanner,
  LoadingState,
  ScrollbarStyles,
  Sidebar,
  TabContent,
} from "./components";
import { HOME_ROUTE } from "./constants";
import {
  useBusinessCurrency,
  useDashboardData,
  useDashboardNavigation,
  useIsMountedRef,
  useOpenNotificationsFallback,
} from "./hooks";
import { countActiveBookings, countCurrentOrders } from "./lib";
import {
  CONTENT_CONTAINER_CLASS,
  MAIN_CLASS,
  ROOT_CLASS,
  SCROLL_AREA_CLASS,
} from "./styles";
import type { DashboardTab, NavCounts } from "./types";

function CustomerDashboardContent() {
  const { user } = useUser();
  const userId = user?.id;
  const router = useRouter();
  const supabase = useSupabaseClient();

  const isMountedRef = useIsMountedRef();
  const navigation = useDashboardNavigation();
  const currency = useBusinessCurrency(supabase, isMountedRef);
  const data = useDashboardData({ supabase, userId, isMountedRef });
  useOpenNotificationsFallback();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const backToCafe = useCallback(() => router.push(HOME_ROUTE), [router]);

  const { selectTab } = navigation;
  const handleSelectTab = useCallback(
    (tab: DashboardTab) => {
      selectTab(tab);
      setIsSidebarOpen(false);
    },
    [selectTab],
  );

  const counts = useMemo<NavCounts>(
    () => ({
      orders: countCurrentOrders(data.orders),
      bookings: countActiveBookings(data.bookings),
      favorites: data.favorites.length,
    }),
    [data.orders, data.bookings, data.favorites.length],
  );

  return (
    <div className={ROOT_CLASS}>
      <Sidebar
        isOpen={isSidebarOpen}
        activeTab={navigation.activeTab}
        counts={counts}
        onClose={closeSidebar}
        onSelectTab={handleSelectTab}
      />

      <main className={MAIN_CLASS}>
        <DashboardHeader
          activeTab={navigation.activeTab}
          isSidebarOpen={isSidebarOpen}
          onOpenMenu={openSidebar}
          onBackToCafe={backToCafe}
        />

        {data.favError && <ErrorBanner message={data.favError} />}

        <div className={SCROLL_AREA_CLASS}>
          <div className={CONTENT_CONTAINER_CLASS}>
            {data.loading ? (
              <LoadingState />
            ) : (
              <TabContent
                navigation={navigation}
                currency={currency}
                orders={data.orders}
                bookings={data.bookings}
                favorites={data.favorites}
                favLoading={data.favLoading}
                onRefreshBookings={data.fetchBookings}
                onRemoveFavorite={data.removeFavorite}
              />
            )}
          </div>
        </div>
      </main>

      <ScrollbarStyles />
    </div>
  );
}

/**
 * Customer dashboard. `useSearchParams` requires a Suspense boundary, so the
 * boundary lives here and the route's page.tsx stays a plain server component.
 */
export default function CustomerDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <CustomerDashboardContent />
    </Suspense>
  );
}