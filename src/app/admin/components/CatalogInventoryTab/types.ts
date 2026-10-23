import type { CatalogItemInput } from "@/app/admin/actions/catalogActions";
import type { useSupabaseClient } from "@/utils/supabase/client";

export type SupabaseClientLike = ReturnType<typeof useSupabaseClient>;

export type Banner = { type: "error" | "success"; message: string } | null;

export type ItemType = "product" | "service";

export type CatalogCategory = CatalogItemInput["category"];

export type ToggleField = "is_active" | "is_popular";

/** Values read from the (uncontrolled) item form. */
export interface ParsedCatalogForm {
  name: string;
  numericPrice: number;
  category: CatalogCategory;
  description: string | null;
  isPopular: boolean;
  isActive: boolean;
  durationMinutes: number | null;
  rating: number | null;
}

export type FormParseResult =
  | { ok: true; values: ParsedCatalogForm }
  | { ok: false; error: string };

export type GalleryValidation =
  | { ok: true; files: File[] }
  | { ok: false; error: string };
