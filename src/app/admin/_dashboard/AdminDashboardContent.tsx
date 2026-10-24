import { useCallback, useState } from "react";

import { AdminAssistant } from "./components/AdminAssistant";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminTabContent } from "./components/AdminTabContent";
import { ScrollbarStyles } from "./components/ScrollbarStyles";
import { SidebarOverlay } from "./components/SidebarOverlay";
import { DEFAULT_TIME_RANGE } from "./constants";
import { useAdminData } from "./hooks/useAdminData";
import { useAdminSignOut } from "./hooks/useAdminSignOut";
import { useAdminTab } from "./hooks/useAdminTab";
import { useAnalytics } from "./hooks/useAnalytics";
import { useBusinessCurrency } from "./hooks/useBusinessCurrency";
import { useSidebar } from "./hooks/useSidebar";
import type { AdminTab, OrderView, TimeRange } from "./types";

export default function AdminDashboardContent() {
  const sidebar = useSidebar();
  const { activeTab, selectTab } = useAdminTab();
  const { isSigningOut, signOut } = useAdminSignOut();

  const currency = useBusinessCurrency();
  const { orders, bookings, locations, refreshBookings } = useAdminData();

  // Tab UI state lives here so it survives switching tabs.
  const [orderView, setOrderView] = useState<OrderView>("active");
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(DEFAULT_TIME_RANGE);

  const { filteredAnalyticsData, pieData } = useAnalytics(orders, timeRange);

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const { close: closeSidebar } = sidebar;

  const handleSelectTab = useCallback(
    (tab: AdminTab) => {
      selectTab(tab);
      closeSidebar();
    },
    [closeSidebar, selectTab],
  );

  const openAssistant = useCallback(() => setIsAssistantOpen(true), []);
  const closeAssistant = useCallback(() => setIsAssistantOpen(false), []);

  const openAssistantFromSidebar = useCallback(() => {
    setIsAssistantOpen(true);
    closeSidebar();
  }, [closeSidebar]);

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  return (
    <div className="relative app-shell flex h-screen overflow-hidden bg-cafe-bg font-sans text-cafe-fg transition-colors duration-300">
      <SidebarOverlay isOpen={sidebar.isOpen} onClose={closeSidebar} />

      <AdminSidebar
        isOpen={sidebar.isOpen}
        activeTab={activeTab}
        isSigningOut={isSigningOut}
        onClose={closeSidebar}
        onSelectTab={handleSelectTab}
        onOpenAssistant={openAssistantFromSidebar}
        onSignOut={handleSignOut}
      />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader
          activeTab={activeTab}
          isSidebarOpen={sidebar.isOpen}
          onOpenSidebar={sidebar.open}
        />

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="p-6 md:p-12">
            <AdminTabContent
              activeTab={activeTab}
              currency={currency}
              orders={orders}
              orderView={orderView}
              onOrderViewChange={setOrderView}
              openStatusMenu={openStatusMenu}
              onOpenStatusMenuChange={setOpenStatusMenu}
              bookings={bookings}
              onRefreshBookings={refreshBookings}
              locations={locations}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              analytics={filteredAnalyticsData}
              pieData={pieData}
              onOpenAssistant={openAssistant}
            />
          </div>
        </div>
      </main>

      <AdminAssistant isOpen={isAssistantOpen} onClose={closeAssistant} />

      <ScrollbarStyles />
    </div>
  );
}
