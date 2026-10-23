"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useUser } from "@clerk/nextjs";

import ProductDetailModal from "@/components/ProductDetailModal";

import { CatalogCard } from "./components/CatalogCard";
import { CatalogGridSkeleton } from "./components/CatalogGridSkeleton";
import { CategoryTabs } from "./components/CategoryTabs";
import { LoadErrorBanner } from "./components/LoadErrorBanner";
import { MenuFooter } from "./components/MenuFooter";
import { MenuHeading } from "./components/MenuHeading";
import { NoResults } from "./components/NoResults";
import { ResultsStatus } from "./components/ResultsStatus";
import { SearchInput } from "./components/SearchInput";
import { ShowMoreButton } from "./components/ShowMoreButton";
import { SortMenu } from "./components/SortMenu";
import { MENU_SECTION_DOM_ID } from "./constants";
import { useCartFeedback } from "./hooks/useCartFeedback";
import { useCatalogData } from "./hooks/useCatalogData";
import { useFavorites } from "./hooks/useFavorites";
import { useHasMounted } from "./hooks/useHasMounted";
import { useHighlightScroll } from "./hooks/useHighlightScroll";
import { useImageGallery } from "./hooks/useImageGallery";
import { useMenuFilters } from "./hooks/useMenuFilters";
import { usePrefillMenu } from "./hooks/usePrefillMenu";
import { createPriceFormatter } from "./lib/catalog";
import type { CatalogGridProps } from "./types";
import { containerVariants, itemVariants } from "./variants";

export default function CatalogGrid({
  onAddItem,
  favoriteIds,
  setFavoriteIds,
}: CatalogGridProps) {
  const { user } = useUser();
  const userId = user?.id;

  const mounted = useHasMounted();

  const catalog = useCatalogData({
    userId,
    onFavoritesLoaded: setFavoriteIds,
  });

  const formatPrice = useMemo(
    () => createPriceFormatter(catalog.currency),
    [catalog.currency],
  );

  const filters = useMenuFilters(catalog.items);
  const gallery = useImageGallery();

  const { recentlyAddedIds, handleAddToCart } = useCartFeedback({
    onAddItem,
    formatPrice,
  });

  const { pendingFavoriteIds, toggleFavorite } = useFavorites({
    userId,
    favoriteIds,
    setFavoriteIds,
  });

  const { highlightedItemId } = usePrefillMenu({
    items: catalog.items,
    setActiveCategory: filters.setActiveCategory,
    setSearchQuery: filters.setSearchQuery,
    onAddToCart: handleAddToCart,
  });

  const gridRef = useRef<HTMLDivElement>(null);

  useHighlightScroll({
    highlightedItemId,
    processedItems: filters.processedItems,
    visibleCount: filters.visibleCount,
    revealIndex: filters.revealIndex,
    containerRef: gridRef,
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () =>
      selectedItemId
        ? (catalog.items.find((item) => item.id === selectedItemId) ?? null)
        : null,
    [catalog.items, selectedItemId],
  );

  const closeItem = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  // Avoid hydration mismatches: reserve space until the client mounts.
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-[600px] w-full bg-[#FAF9F6] dark:bg-black"
      />
    );
  }

  return (
    <section
      id={MENU_SECTION_DOM_ID}
      className="mx-auto w-full max-w-7xl space-y-12 bg-[#FAF9F6] px-4 py-24 transition-colors duration-300 dark:bg-black"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.1 }}
        variants={containerVariants}
        className="flex flex-col space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-end"
        >
          <MenuHeading />

          <CategoryTabs
            active={filters.activeCategory}
            onChange={filters.setActiveCategory}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 md:flex-row"
        >
          <SearchInput
            value={filters.searchQuery}
            category={filters.activeCategory}
            onChange={filters.setSearchQuery}
          />

          <SortMenu value={filters.sortBy} onChange={filters.setSortBy} />
        </motion.div>
      </motion.div>

      <ResultsStatus
        loading={catalog.loading}
        count={filters.processedItems.length}
      />

      {catalog.loadError && (
        <LoadErrorBanner
          message={catalog.loadError}
          isRetrying={catalog.isRetrying}
          onRetry={catalog.retry}
        />
      )}

      {catalog.loading ? (
        <CatalogGridSkeleton />
      ) : (
        <motion.div
          ref={gridRef}
          layout
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          className="grid min-h-[400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filters.displayedItems.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                imageIndex={gallery.imageIndexes[item.id] ?? 0}
                priceLabel={formatPrice(item.numeric_price)}
                isFavorited={favoriteIds.includes(item.id)}
                isFavoritePending={pendingFavoriteIds.has(item.id)}
                isHighlighted={highlightedItemId === item.id}
                justAdded={recentlyAddedIds.has(item.id)}
                onOpen={setSelectedItemId}
                onToggleFavorite={toggleFavorite}
                onAddToCart={handleAddToCart}
                onImageNav={gallery.navigate}
              />
            ))}
          </AnimatePresence>

          {filters.processedItems.length === 0 && <NoResults />}
        </motion.div>
      )}

      {filters.hasMore && <ShowMoreButton onClick={filters.showMore} />}

      <MenuFooter />

      <ProductDetailModal
        item={selectedItem}
        onClose={closeItem}
        onAddToCart={handleAddToCart}
        isFavorited={
          selectedItem ? favoriteIds.includes(selectedItem.id) : false
        }
        isFavoritePending={
          selectedItem ? pendingFavoriteIds.has(selectedItem.id) : false
        }
        onToggleFavorite={toggleFavorite}
        currency={catalog.currency}
      />
    </section>
  );
}
