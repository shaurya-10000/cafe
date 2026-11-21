import { useCallback, useState } from "react";
import type { CatalogItem } from "@/types/catalog";
import { MAX_QUANTITY, MIN_QUANTITY } from "../constants";
import { getMediaList } from "../lib/media";
import { ProductGallery } from "./gallery/ProductGallery";
import { AddToCartButton } from "./product/AddToCartButton";
import { FavoriteButton } from "./product/FavoriteButton";
import { ProductHeader } from "./product/ProductHeader";
import { QuantityStepper } from "./product/QuantityStepper";
import { ReviewsSection } from "./reviews/ReviewsSection";

interface ProductContentProps {
  readonly item: CatalogItem;
  readonly titleId: string;
  readonly currency: string;
  readonly reducedMotion: boolean;
  readonly isFavorited: boolean;
  readonly isFavoritePending: boolean;
  readonly onToggleFavorite: (id: string) => void;
  readonly onAddToCart: (item: CatalogItem, quantity: number) => void;
  readonly onClose: () => void;
}

/**
 * Mounted with key={item.id} by the modal, so quantity, gallery position and
 * reviews all reset naturally whenever a different item opens.
 */
export function ProductContent({
  item,
  titleId,
  currency,
  reducedMotion,
  isFavorited,
  isFavoritePending,
  onToggleFavorite,
  onAddToCart,
  onClose,
}: ProductContentProps) {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const isSoldOut = item.in_stock === false;

  const decrement = useCallback(
    () => setQuantity((q) => Math.max(MIN_QUANTITY, q - 1)),
    [],
  );
  const increment = useCallback(
    () => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1)),
    [],
  );

  const handleAdd = useCallback(() => {
    if (isSoldOut) return;
    onAddToCart(item, quantity);
    onClose();
  }, [item, isSoldOut, quantity, onAddToCart, onClose]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <ProductGallery
        name={item.name}
        media={getMediaList(item)}
        reducedMotion={reducedMotion}
      />

      <div className="flex flex-col space-y-6 p-6 md:p-8">
        <ProductHeader item={item} titleId={titleId} currency={currency} />

        {isSoldOut ? (
          <div className="inline-flex w-fit items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500">
            Sold Out — Currently Unavailable
          </div>
        ) : item.track_stock && typeof item.stock_quantity === "number" ? (
          <div
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              item.stock_quantity <= 5
                ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            }`}
          >
            {item.stock_quantity <= 5
              ? `Low Stock — Only ${item.stock_quantity} Left`
              : `In Stock (${item.stock_quantity} available)`}
          </div>
        ) : (
          <div className="inline-flex w-fit items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-500">
            In Stock
          </div>
        )}

        {item.description && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <QuantityStepper
            quantity={quantity}
            onDecrement={decrement}
            onIncrement={increment}
          />

          <FavoriteButton
            itemName={item.name}
            isFavorited={isFavorited}
            isPending={isFavoritePending}
            onToggle={() => onToggleFavorite(item.id)}
          />
        </div>
        {isSoldOut ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-2xl bg-zinc-200 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          >
            Sold Out
          </button>
        ) : (
          <AddToCartButton quantity={quantity} onClick={handleAdd} />
        )}

        <ReviewsSection itemId={item.id} />
      </div>
    </div>
  );
}
