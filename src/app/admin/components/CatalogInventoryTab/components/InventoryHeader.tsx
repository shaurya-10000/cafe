import { memo } from "react";

export const InventoryHeader = memo(function InventoryHeader() {
  return (
    <header className="flex items-center justify-between border-b border-cafe-border pb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-cafe-fg md:text-4xl">
          Inventory
        </h1>

        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Cafe Product Ecosystem
        </p>
      </div>

      <div className="hidden items-center gap-3 rounded-full border border-blue-500/10 bg-blue-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 sm:flex">
        <div
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"
        />
        Live Sync
      </div>
    </header>
  );
});
