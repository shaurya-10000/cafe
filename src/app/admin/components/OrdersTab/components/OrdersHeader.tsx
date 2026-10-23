import { memo } from "react";

import { VIEW_SUBTITLES } from "../constants";
import type { OrderView } from "../types";
import { OrderViewSwitcher } from "./OrderViewSwitcher";

interface OrdersHeaderProps {
  view: OrderView;
  activeCount: number;
  advancedCount: number;
  onChangeView: (view: OrderView) => void;
}

export const OrdersHeader = memo(function OrdersHeader({
  view,
  activeCount,
  advancedCount,
  onChangeView,
}: OrdersHeaderProps) {
  return (
    <header className="flex flex-col items-start justify-between gap-6 border-b border-cafe-border pb-8 xl:flex-row xl:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-cafe-fg md:text-4xl">
          Orders
        </h1>

        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {VIEW_SUBTITLES[view]}
        </p>
      </div>

      <OrderViewSwitcher
        view={view}
        activeCount={activeCount}
        advancedCount={advancedCount}
        onChange={onChangeView}
      />
    </header>
  );
});
