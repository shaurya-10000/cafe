import { memo } from "react";

export const CatalogCardSkeleton = memo(function CatalogCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[280px] flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[#EAE9E4] bg-[#F5F5F1] p-8 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <div className="flex items-start justify-between">
        <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-1 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
});
