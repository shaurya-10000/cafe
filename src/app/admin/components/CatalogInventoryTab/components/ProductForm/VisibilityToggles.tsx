import { memo, useState } from "react";

import type { CatalogItem } from "@/types/catalog";

import { FIELD_LABEL_CLASS, INPUT_CLASS } from "../../styles";

interface VisibilityTogglesProps {
  product: CatalogItem | null;
}

export const VisibilityToggles = memo(function VisibilityToggles({
  product,
}: VisibilityTogglesProps) {
  const [trackStock, setTrackStock] = useState(Boolean(product?.track_stock));

  return (
    <div className="space-y-3">
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

        <label className="flex cursor-pointer select-none items-center gap-3 px-1 py-1">
          <input
            type="checkbox"
            name="track_stock"
            checked={trackStock}
            onChange={(event) => setTrackStock(event.target.checked)}
            className="h-4 w-4 rounded accent-cafe-accent"
          />

          <span className={FIELD_LABEL_CLASS}>Track stock</span>
        </label>
      </div>

      {trackStock && (
        <div className="space-y-1.5">
          <label htmlFor="stock_quantity" className={FIELD_LABEL_CLASS}>
            Stock quantity
          </label>

          <input
            id="stock_quantity"
            name="stock_quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock_quantity ?? 0}
            placeholder="0"
            aria-label="Stock quantity"
            className={INPUT_CLASS}
            required
          />
        </div>
      )}
    </div>
  );
});