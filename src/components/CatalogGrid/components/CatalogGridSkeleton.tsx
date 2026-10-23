import { memo } from "react";

import { ITEMS_PER_PAGE } from "../constants";
import { CatalogCardSkeleton } from "./CatalogCardSkeleton";

export const CatalogGridSkeleton = memo(function CatalogGridSkeleton() {
  return (
    <div className="grid min-h-[400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
        <CatalogCardSkeleton key={index} />
      ))}
    </div>
  );
});
