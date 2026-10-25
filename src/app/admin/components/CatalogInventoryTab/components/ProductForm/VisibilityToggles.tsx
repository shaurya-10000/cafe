import { memo } from "react";

import type { CatalogItem } from "@/types/catalog";

import { FIELD_LABEL_CLASS } from "../../styles";

interface VisibilityTogglesProps {
  product: CatalogItem | null;
}

export const VisibilityToggles = memo(function VisibilityToggles({
  product,
}: VisibilityTogglesProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <label className="flex cursor-pointer select-none items-center gap-3 px-1 py-1">
        <input
          type="checkbox"
          name="is_popular"
          defaultChecked={!!product?.is_popular}
          className="h-4 w-4 rounded accent-cafe-accent"
        />

        <span className={FIELD_LABEL_CLASS}>Mark as Popular</span>
      </label>

      <label className="flex cursor-pointer select-none items-center gap-3 px-1 py-1">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={product ? product.is_active : true}
          className="h-4 w-4 rounded accent-emerald-500"
        />

        <span className={FIELD_LABEL_CLASS}>Visible to customers</span>
      </label>
    </div>
  );
});
