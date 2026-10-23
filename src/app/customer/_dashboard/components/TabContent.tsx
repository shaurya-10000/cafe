import { BookingsTab } from "../../components/BookingsTab";
import { CouponsTab } from "../../components/CouponsTab";
import { FavoritesTab } from "../../components/FavoritesTab";
import { OrdersTab } from "../../components/OrdersTab";
import type {
  BookingRow,
  DashboardNavigation,
  FavoriteItem,
  OrderRow,
} from "../types";

interface TabContentProps {
  navigation: DashboardNavigation;
  currency: string;
  orders: OrderRow[];
  bookings: BookingRow[];
  favorites: FavoriteItem[];
  favLoading: boolean;
  onRefreshBookings: () => void | Promise<void>;
  onRemoveFavorite: (id: string) => void | Promise<void>;
}

export function TabContent({
  navigation,
  currency,
  orders,
  bookings,
  favorites,
  favLoading,
  onRefreshBookings,
  onRemoveFavorite,
}: TabContentProps) {
  const { activeTab, orderView, setOrderView, rateOrderId, clearRateOrder } =
    navigation;

  return (
    <div className="min-h-screen">
      {activeTab === "orders" && (
        <OrdersTab
          orders={orders}
          view={orderView}
          setView={setOrderView}
          currency={currency}
          externalRatingOrderId={rateOrderId}
          onExternalRatingClosed={clearRateOrder}
        />
      )}

      {activeTab === "bookings" && (
        <BookingsTab bookings={bookings} onRefresh={onRefreshBookings} />
      )}

      {activeTab === "favorites" && (
        <FavoritesTab
          favorites={favorites}
          favLoading={favLoading}
          onRemove={onRemoveFavorite}
          currency={currency}
        />
      )}

      {activeTab === "coupons" && <CouponsTab />}
    </div>
  );
}