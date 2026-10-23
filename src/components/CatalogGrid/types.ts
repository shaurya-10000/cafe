import type { Dispatch, SetStateAction } from "react";

import type { useSupabaseClient } from "@/utils/supabase/client";

import type { CATEGORIES } from "./constants";

export type Category = (typeof CATEGORIES)[number];

export type SortOption = "popular" | "price-low" | "price-high";

export type GalleryDirection = "prev" | "next";

export type SupabaseClient = ReturnType<typeof useSupabaseClient>;

export interface CartItemInput {
  id: string;
  name: string;
  price: string;
  numeric_price: number;
}

export type AddItemHandler = (item: CartItemInput, quantity?: number) => void;

export interface CatalogGridProps {
  onAddItem: AddItemHandler;
  favoriteIds: string[];
  setFavoriteIds: Dispatch<SetStateAction<string[]>>;
}

/** Payload of the `cafe_prefill_menu` window event. */
export interface PrefillMenuDetail {
  category?: string;
  search?: string;
  maxPrice?: number;
  itemsToAdd?: Array<{
    itemId?: string;
    itemName?: string;
    quantity?: number;
  }>;
  itemToAdd?: {
    id?: string;
    name?: string;
    quantity?: number;
  };
  highlightItemId?: string;
}

export interface RequestedItem {
  itemId?: string;
  itemName?: string;
  quantity?: number;
}
