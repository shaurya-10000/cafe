import { useCallback, useState } from "react";

import { deleteCatalogItem } from "@/app/admin/actions/catalogActions";
import { useSupabaseClient } from "@/utils/supabase/client";

import { deleteStorageObjects } from "../api/storage";
import { useIsMounted } from "./useIsMounted";
import type { UseBannerResult } from "./useBanner";

interface UseCatalogDeleteOptions {
  /** Id of the item currently open in the form, if any. */
  editingProductId: string | undefined;
  resetForm: () => void;
  banner: Pick<UseBannerResult, "showError" | "showSuccess" | "clearBanner">;
}

export interface UseCatalogDeleteResult {
  deletingId: string | null;
  handleDelete: (id: string, name: string) => Promise<void>;
}

export function useCatalogDelete({
  editingProductId,
  resetForm,
  banner,
}: UseCatalogDeleteOptions): UseCatalogDeleteResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const { showError, showSuccess, clearBanner } = banner;

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (id: string, name: string): Promise<void> => {
      if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

      setDeletingId(id);
      clearBanner();

      try {
        const result = await deleteCatalogItem(id);

        if (!result.ok) throw new Error(result.error);

        if (result.media.length > 0) {
          await deleteStorageObjects(supabase, result.media);
        }

        if (!isMounted()) return;

        if (editingProductId === id) resetForm();

        showSuccess(`"${name}" deleted.`);
      } catch (error) {
        if (!isMounted()) return;

        showError(
          error instanceof Error
            ? error.message
            : "Couldn't delete this item \u2014 it may be referenced by existing orders, bookings, or reviews. Try marking it inactive instead.",
        );
      } finally {
        if (isMounted()) setDeletingId(null);
      }
    },
    [
      clearBanner,
      editingProductId,
      isMounted,
      resetForm,
      showError,
      showSuccess,
      supabase,
    ],
  );

  return { deletingId, handleDelete };
}
