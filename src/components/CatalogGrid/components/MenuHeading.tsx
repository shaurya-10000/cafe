import { memo } from "react";

export const MenuHeading = memo(function MenuHeading() {
  return (
    <div className="space-y-2 text-center md:text-left">
      <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
        The Lineup
      </h2>

      <p className="text-sm font-medium text-zinc-500">
        Curated for high-performance flavor.
      </p>
    </div>
  );
});
