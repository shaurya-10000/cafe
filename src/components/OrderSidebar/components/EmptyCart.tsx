import { memo } from "react";

import { ShoppingBag } from "lucide-react";

export const EmptyCart = memo(function EmptyCart() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4 py-20 text-center opacity-50">
      <ShoppingBag
        size={40}
        className="text-zinc-300 dark:text-zinc-700"
        aria-hidden="true"
      />

      <p className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500">
        Your bag is empty.
      </p>
    </div>
  );
});
