import { memo } from "react";

import { SearchX } from "lucide-react";

export const NoResults = memo(function NoResults() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-zinc-400">
      <SearchX size={32} aria-hidden="true" />

      <p className="text-sm font-bold uppercase tracking-widest">
        No items match your search
      </p>
    </div>
  );
});
