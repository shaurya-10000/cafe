import { memo } from "react";

interface OrderTotalProps {
  formattedTotal: string;
}

export const OrderTotal = memo(function OrderTotal({
  formattedTotal,
}: OrderTotalProps) {
  return (
    <div className="flex flex-col items-start lg:items-end">
      <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
        Grand Total
      </p>

      <p className="font-mono text-2xl font-black leading-none text-cafe-fg">
        {formattedTotal}
      </p>
    </div>
  );
});
