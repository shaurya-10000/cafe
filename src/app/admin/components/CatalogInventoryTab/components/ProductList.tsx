import { memo } from "react";

import { Loader2, ShoppingBag } from "lucide-react";

import type { CatalogItem } from "@/types/catalog";

import { ProductRow } from "./ProductRow";
import { ProductSearch } from "./ProductSearch";

interface ProductListProps {
  products: CatalogItem[];
  loading: boolean;
  searchTerm: string;
  deletingId: string | null;
  onSearchChange: (value: string) => void;
  onEdit: (product: CatalogItem) => void;
  onDelete: (id: string, name: string) => void;
}

export const ProductList = memo(function ProductList({
  products,
  loading,
  searchTerm,
  deletingId,
  onSearchChange,
  onEdit,
  onDelete,
}: ProductListProps) {
  return (
    <div className="flex min-h-[500px] flex-col overflow-hidden rounded-[2.5rem] border border-cafe-border bg-cafe-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-cafe-border bg-cafe-fg/[0.01] p-6">
        <ProductSearch value={searchTerm} onChange={onSearchChange} />
      </div>

      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="animate-spin text-gray-400"
              size={24}
              aria-hidden="true"
            />

            <span className="sr-only">Loading inventory&hellip;</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
            <ShoppingBag size={28} aria-hidden="true" />

            <p className="text-sm font-bold">No products found</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isDeleting={deletingId === product.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
});
