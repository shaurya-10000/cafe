import { useMemo } from "react";
import { Star } from "lucide-react";
import type { CatalogItem } from "@/types/catalog";
import { createPriceFormatter } from "../../lib/format";

interface ProductHeaderProps {
  readonly item: CatalogItem;
  readonly titleId: string;
  readonly currency: string;
}

export function ProductHeader({ item, titleId, currency }: ProductHeaderProps) {
  const formatPrice = useMemo(() => createPriceFormatter(currency), [currency]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cafe-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cafe-accent">
          {item.category}
        </span>

        {item.is_popular && (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-amber-500">
            <Star size={9} fill="currentColor" aria-hidden="true" />
            Popular
          </span>
        )}

        {/*
          item.rating is deliberately NOT the review average shown in the
          Reviews section. catalog_items.rating has no trigger tying it to
          actual reviews, so presenting it as customer feedback would be
          showing a possibly stale, independently-set field as if it were one.
        */}
        {item.rating != null && (
          <span className="flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-zinc-500">
            <Star size={9} fill="currentColor" aria-hidden="true" />
            {item.rating.toFixed(1)} Rating
          </span>
        )}
      </div>

      <h2
        id={titleId}
        className="text-3xl font-black uppercase leading-none tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-4xl"
      >
        {item.name}
      </h2>

      <p className="text-2xl font-black italic text-cafe-accent">
        {formatPrice(item.numeric_price)}
      </p>
    </div>
  );
}
