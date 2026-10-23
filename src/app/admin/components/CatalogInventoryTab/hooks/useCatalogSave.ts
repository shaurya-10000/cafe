import { useCallback, useRef, useState, type FormEvent } from "react";

import { CATALOG_MAX_GALLERY_IMAGES } from "@/types/catalog";
import {
  createCatalogItem,
  updateCatalogItem,
  type CatalogItemInput,
} from "@/app/admin/actions/catalogActions";
import { useSupabaseClient } from "@/utils/supabase/client";

import { deleteStorageObjects, uploadCatalogFile } from "../api/storage";
import { parseCatalogForm } from "../lib/forms";
import { useIsMounted } from "./useIsMounted";
import type { UseBannerResult } from "./useBanner";
import type { UseCatalogFormResult } from "./useCatalogForm";

interface UseCatalogSaveOptions {
  form: UseCatalogFormResult;
  banner: Pick<UseBannerResult, "showError" | "showSuccess" | "clearBanner">;
}

export interface UseCatalogSaveResult {
  submitting: boolean;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Create / update an item: upload images, write the row through the server
 * action, then clean up whatever the save made obsolete. If anything fails,
 * only the files uploaded by *this* submission are rolled back; media the
 * user did not touch is never at risk.
 */
export function useCatalogSave({
  form,
  banner,
}: UseCatalogSaveOptions): UseCatalogSaveResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const { showError, showSuccess, clearBanner } = banner;
  const {
    editingProduct,
    itemType,
    mainFile,
    galleryFiles,
    existingGalleryUrls,
    reset,
  } = form;

  /** Authoritative double-submit guard; state only drives rendering. */
  const inFlightRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      if (inFlightRef.current) return;

      clearBanner();

      const parsed = parseCatalogForm(new FormData(event.currentTarget), {
        itemType,
        missingRequiredImage: !editingProduct && !mainFile,
      });

      if (!parsed.ok) {
        showError(parsed.error);
        return;
      }

      const { values } = parsed;

      inFlightRef.current = true;
      setSubmitting(true);

      const uploadedThisSubmission: string[] = [];

      try {
        const previousMainUrl = editingProduct?.media?.[0] ?? null;
        let mainUrl = previousMainUrl;

        if (mainFile) {
          mainUrl = await uploadCatalogFile(supabase, mainFile);
          uploadedThisSubmission.push(mainUrl);
        }

        if (!mainUrl) {
          // Guarded above for new items; keeps this branch honest at runtime.
          throw new Error("A background image is required.");
        }

        // Record every successful upload even if a sibling fails, so the
        // rollback below never leaves orphans behind.
        const newGalleryUrls: string[] = [];

        if (galleryFiles.length > 0) {
          const results = await Promise.allSettled(
            galleryFiles.map((file) => uploadCatalogFile(supabase, file)),
          );

          let firstFailure: unknown = null;

          for (const result of results) {
            if (result.status === "fulfilled") {
              newGalleryUrls.push(result.value);
              uploadedThisSubmission.push(result.value);
            } else if (firstFailure === null) {
              firstFailure = result.reason;
            }
          }

          if (firstFailure !== null) throw firstFailure;
        }

        const media = [mainUrl, ...existingGalleryUrls, ...newGalleryUrls].slice(
          0,
          1 + CATALOG_MAX_GALLERY_IMAGES,
        );

        const payload: CatalogItemInput = {
          name: values.name,
          numeric_price: values.numericPrice,
          category: values.category,
          description: values.description,
          item_type: itemType,
          duration_minutes: values.durationMinutes,
          media,
          is_popular: values.isPopular,
          is_active: values.isActive,
          rating: values.rating,
        };

        const result = editingProduct
          ? await updateCatalogItem(editingProduct.id, payload)
          : await createCatalogItem(payload);

        if (!result.ok) throw new Error(result.error);

        // The save is persisted: clean up what it made obsolete (a replaced
        // background image, or gallery images removed this session).
        const orphaned: string[] = [];

        if (editingProduct) {
          if (previousMainUrl && previousMainUrl !== mainUrl) {
            orphaned.push(previousMainUrl);
          }

          orphaned.push(
            ...(editingProduct.media?.slice(1) ?? []).filter(
              (url) => !media.includes(url),
            ),
          );
        }

        if (orphaned.length > 0) {
          await deleteStorageObjects(supabase, orphaned);
        }

        if (!isMounted()) return;

        showSuccess(
          `"${values.name}" ${editingProduct ? "updated" : "added to the catalog"}.`,
        );
        reset();
      } catch (error) {
        if (uploadedThisSubmission.length > 0) {
          await deleteStorageObjects(supabase, uploadedThisSubmission);
        }

        if (!isMounted()) return;

        showError(
          error instanceof Error
            ? error.message
            : "Something went wrong saving this item. Please try again.",
        );
      } finally {
        inFlightRef.current = false;

        if (isMounted()) setSubmitting(false);
      }
    },
    [
      clearBanner,
      editingProduct,
      existingGalleryUrls,
      galleryFiles,
      isMounted,
      itemType,
      mainFile,
      reset,
      showError,
      showSuccess,
      supabase,
    ],
  );

  return { submitting, handleSubmit };
}
