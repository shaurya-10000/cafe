import { memo } from "react";

import { Clock, Star } from "lucide-react";

import type { CatalogItem } from "@/types/catalog";

import { cx } from "../../lib/cx";
import { INPUT_CLASS, SELECT_CLASS } from "../../styles";
import type { ItemType } from "../../types";

interface TypeFieldsProps {
  itemType: ItemType;
  product: CatalogItem | null;
  onItemTypeChange: (type: ItemType) => void;
}

/** Item type, plus duration (services) or rating (products). */
export const TypeFields = memo(function TypeFields({
  itemType,
  product,
  onItemTypeChange,
}: TypeFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <select
        name="item_type"
        value={itemType}
        onChange={(event) => onItemTypeChange(event.target.value as ItemType)}
        aria-label="Item type"
        className={SELECT_CLASS}
      >
        <option value="product">Product</option>
        <option value="service">Service</option>
      </select>

      {itemType === "service" ? (
        <div className="relative">
          <Clock
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={14}
            aria-hidden="true"
          />

          <input
            name="duration_minutes"
            type="number"
            min="1"
            step="1"
            defaultValue={product?.duration_minutes || ""}
            placeholder="Duration (min)"
            aria-label="Duration in minutes"
            className={cx(INPUT_CLASS, "pl-9")}
            required
          />
        </div>
      ) : (
        <div className="relative">
          <Star
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={14}
            aria-hidden="true"
          />

          <input
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            defaultValue={product?.rating ?? ""}
            placeholder="Rating (0-5)"
            aria-label="Rating"
            className={cx(INPUT_CLASS, "pl-9")}
          />
        </div>
      )}
    </div>
  );
});
