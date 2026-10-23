import type { AdminLocation } from "@/app/admin/components/Locationstab";

import { AdminBookingsTab } from "@/app/admin/components/AdminReservationsTab";
import { AnalyticsTab } from "@/app/admin/components/AnalyticsTab";
import { CatalogInventoryTab } from "@/app/admin/components/CatalogInventoryTab";
import { CouponsTab } from "@/app/admin/components/CouponsTab";
import { LocationsTab } from "@/app/admin/components/Locationstab";
import { OrdersTab } from "@/app/admin/components/OrdersTab";
import { toggleOrderPayment, updateOrderStatus } from "@/app/admin/actions";

import type {
  AdminTab,
  BookingRow,
  FilteredAnalytics,
  OrderRow,
  OrderView,
  PieDatum,
  TimeRange,
} from "../types";

interface AdminTabContentProps {
  activeTab: AdminTab;
  currency: string;

  orders: OrderRow[];
  orderView: OrderView;
  onOrderViewChange: (view: OrderView) => void;
  openStatusMenu: string | null;
  onOpenStatusMenuChange: (id: string | null) => void;

  bookings: BookingRow[];
  onRefreshBookings: () => void;

  locations: AdminLocation[];

  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  analytics: FilteredAnalytics;
  pieData: PieDatum[];
  onOpenAssistant: () => void;
}

/** Renders the module for the active tab; only that tab is mounted. */
export function AdminTabContent({
  activeTab,
  currency,
  orders,
  orderView,
  onOrderViewChange,
  openStatusMenu,
  onOpenStatusMenuChange,
  bookings,
  onRefreshBookings,
  locations,
  timeRange,
  onTimeRangeChange,
  analytics,
  pieData,
  onOpenAssistant,
}: AdminTabContentProps) {
  switch (activeTab) {
    case "orders":
      return (
        <OrdersTab
          orders={orders}
          orderView={orderView}
          setOrderView={onOrderViewChange}
          openStatusMenu={openStatusMenu}
          setOpenStatusMenu={onOpenStatusMenuChange}
          handleStatusUpdate={updateOrderStatus}
          handlePaymentToggle={toggleOrderPayment}
          currency={currency}
        />
      );

    case "reservations":
      return (
        <AdminBookingsTab bookings={bookings} onRefresh={onRefreshBookings} />
      );

    case "inventory":
      return <CatalogInventoryTab />;

    case "branches":
      return <LocationsTab initialLocations={locations} />;

    case "analytics":
      return (
        <AnalyticsTab
          timeRange={timeRange}
          setTimeRange={onTimeRangeChange}
          filteredAnalyticsData={analytics}
          pieData={pieData}
          currency={currency}
          onOpenAssistant={onOpenAssistant}
        />
      );

    case "coupons":
      return <CouponsTab />;

    default:
      return null;
  }
}
