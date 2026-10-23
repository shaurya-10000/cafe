import { memo } from "react";

import { CATALOG_CATEGORIES, CATALOG_NAME_MAX_LENGTH } from "@/types/catalog";
import type { CatalogItem } from "@/types/catalog";

import { cx } from "../../lib/cx";
import { INPUT_CLASS, INPUT_FOCUS_CLASS, SELECT_CLASS } from "../../styles";

interface BasicFieldsProps {
  product: CatalogItem | null;
}

/** Name, price, category and description (uncontrolled; read on submit). */
export const BasicFields = memo(function BasicFields({ product }: BasicFieldsProps) {
  return (
    <>
      <input
        name="name"
        type="text"
        defaultValue={product?.name || ""}
        placeholder="Product Name"
        maxLength={CATALOG_NAME_MAX_LENGTH}
        aria-label="Product name"
        className={cx(INPUT_CLASS, INPUT_FOCUS_CLASS)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={product?.numeric_price || ""}
          placeholder="0.00"
          aria-label="Price"
          className={INPUT_CLASS}
          required
        />

        <select
          name="category"
          defaultValue={product?.category || CATALOG_CATEGORIES[0]}
          aria-label="Category"
          className={SELECT_CLASS}
        >
          {CATALOG_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="description"
        defaultValue={product?.description || ""}
        placeholder="Description"
        aria-label="Description"
        className={cx(INPUT_CLASS, "min-h-[80px] resize-none")}
      />
    </>
  );
});
