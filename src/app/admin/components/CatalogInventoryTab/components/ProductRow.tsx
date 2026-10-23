import { memo } from "react";

import { Edit3, Loader2, ShoppingBag, Star, Trash2 } from "lucide-react";

import type { CatalogItem } from "@/types/catalog";

import { formatProductMeta } from "../lib/format";

interface ProductRowProps {
  product: CatalogItem;
  isDeleting: boolean;
  onEdit: (product: CatalogItem) => void;
  onDelete: (id: string, name: string) => void;
}

export const ProductRow = memo(function ProductRow({
  product,
  isDeleting,
  onEdit,
  onDelete,
}: ProductRowProps) {
  const thumbnail = product.media?.[0];

  return (
    <div className="group flex flex-col justify-between gap-4 rounded-3xl border border-transparent p-4 transition-all hover:border-cafe-border hover:bg-cafe-fg/[0.03] sm:flex-row sm:items-center">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cafe-border bg-cafe-fg/5">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
          ) : (
            <ShoppingBag size={20} className="text-gray-500" aria-hidden="true" />
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-cafe-fg transition-colors group-hover:text-blue-400">
              {product.name}
            </p>

            {product.is_popular && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-500">
                <Star size={9} fill="currentColor" aria-hidden="true" /> Popular
              </span>
            )}

            {!product.is_active && (
              <span className="rounded-full bg-gray-400/10 px-2 py-0.5 text-[9px] font-black uppercase text-gray-400">
                Inactive
              </span>
            )}
          </div>

          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-tighter text-gray-500">
            {formatProductMeta(product)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 transition-all sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name}`}
          className="rounded-xl border border-cafe-border bg-cafe-fg/5 p-2.5 text-gray-500 transition-all hover:bg-cafe-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Edit3 size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(product.id, product.name)}
          disabled={isDeleting}
          aria-label={`Delete ${product.name}`}
          aria-busy={isDeleting}
          className="rounded-xl border border-red-500/10 bg-red-500/5 p-2.5 text-red-500/40 transition-all hover:bg-red-500/20 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
});
