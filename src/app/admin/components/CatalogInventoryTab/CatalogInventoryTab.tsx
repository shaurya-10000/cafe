"use client";

import { useMemo, useState } from "react";

import { InventoryHeader } from "./components/InventoryHeader";
import { ProductForm } from "./components/ProductForm/ProductForm";
import { ProductList } from "./components/ProductList";
import { StatusBanner } from "./components/StatusBanner";
import { useAiInventoryActions } from "./hooks/useAiInventoryActions";
import { useBanner } from "./hooks/useBanner";
import { useCatalogDelete } from "./hooks/useCatalogDelete";
import { useCatalogForm } from "./hooks/useCatalogForm";
import { useCatalogSave } from "./hooks/useCatalogSave";
import { useItemToggles } from "./hooks/useItemToggles";
import { useProducts } from "./hooks/useProducts";
import { filterProducts } from "./lib/products";

export function CatalogInventoryTab() {
  const banner = useBanner();

  const { products, setProducts, loading } = useProducts({
    onLoadError: banner.showError,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(
    () => filterProducts(products, searchTerm),
    [products, searchTerm],
  );

  const form = useCatalogForm();

  const { submitting, handleSubmit } = useCatalogSave({ form, banner });

  const { deletingId, handleDelete } = useCatalogDelete({
    editingProductId: form.editingProduct?.id,
    resetForm: form.reset,
    banner,
  });

  // AI concierge: "hide the oat latte", "mark the croissant as popular".
  const toggles = useItemToggles({ setProducts, banner });

  useAiInventoryActions({ products, ...toggles });

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <InventoryHeader />

      {banner.banner && <StatusBanner banner={banner.banner} />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-7 xl:col-span-8">
          <ProductList
            products={filteredProducts}
            loading={loading}
            searchTerm={searchTerm}
            deletingId={deletingId}
            onSearchChange={setSearchTerm}
            onEdit={form.startEditing}
            onDelete={handleDelete}
          />
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
          <ProductForm
            form={form}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
