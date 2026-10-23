import {
  useCallback,
  useRef,
  useState,
  type RefObject,
} from "react";

import type { CatalogItem } from "@/types/catalog";

import { validateGalleryFiles, validateMainFile } from "../lib/files";
import type { ItemType } from "../types";
import { useObjectUrl, useObjectUrls } from "./useObjectUrls";

export interface UseCatalogFormResult {
  /** The item being edited, or `null` when creating a new one. */
  editingProduct: CatalogItem | null;
  itemType: ItemType;
  setItemType: (type: ItemType) => void;
  mainFile: File | null;
  mainPreview: string | null;
  galleryFiles: File[];
  galleryPreviews: string[];
  /** Gallery images already stored on the item (and not removed yet). */
  existingGalleryUrls: string[];
  fileError: string | null;
  /** Changes whenever the uncontrolled form must start from scratch. */
  formKey: string;
  mainInputRef: RefObject<HTMLInputElement | null>;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  startEditing: (product: CatalogItem) => void;
  reset: () => void;
  selectMainFile: (file: File | null) => void;
  selectGalleryFiles: (files: File[]) => void;
  removeExistingGalleryImage: (url: string) => void;
  removeNewGalleryFile: (index: number) => void;
}

/**
 * Everything about the item form except the submit itself: which item is
 * being edited, the selected/removed images, and file validation.
 *
 * The text inputs are uncontrolled (read from FormData on submit), so
 * starting over means remounting the form: `formKey` changes when a
 * different item is picked and after every reset, which also clears the
 * fields after a successful "new item" save.
 */
export function useCatalogForm(): UseCatalogFormResult {
  const [editingProduct, setEditingProduct] = useState<CatalogItem | null>(null);
  const [itemType, setItemType] = useState<ItemType>("product");
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [resetCount, setResetCount] = useState(0);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const mainPreview = useObjectUrl(mainFile);
  const galleryPreviews = useObjectUrls(galleryFiles);

  const startEditing = useCallback((product: CatalogItem) => {
    setEditingProduct(product);
    setItemType(product.item_type || "product");
    setFileError(null);
    setMainFile(null);
    setGalleryFiles([]);
    setExistingGalleryUrls(product.media?.slice(1) ?? []);
  }, []);

  const reset = useCallback(() => {
    setEditingProduct(null);
    setItemType("product");
    setFileError(null);
    setMainFile(null);
    setGalleryFiles([]);
    setExistingGalleryUrls([]);
    setResetCount((count) => count + 1);
  }, []);

  const selectMainFile = useCallback((file: File | null) => {
    setFileError(null);

    if (!file) {
      setMainFile(null);
      return;
    }

    const error = validateMainFile(file);

    if (error) {
      setFileError(error);
      return;
    }

    setMainFile(file);
  }, []);

  const selectGalleryFiles = useCallback(
    (files: File[]) => {
      setFileError(null);

      const result = validateGalleryFiles(files, existingGalleryUrls.length);

      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      setGalleryFiles(result.files);
    },
    [existingGalleryUrls.length],
  );

  const removeExistingGalleryImage = useCallback((url: string) => {
    setExistingGalleryUrls((previous) => previous.filter((item) => item !== url));
  }, []);

  const removeNewGalleryFile = useCallback((index: number) => {
    setGalleryFiles((previous) => previous.filter((_, i) => i !== index));
  }, []);

  return {
    editingProduct,
    itemType,
    setItemType,
    mainFile,
    mainPreview,
    galleryFiles,
    galleryPreviews,
    existingGalleryUrls,
    fileError,
    formKey: `${editingProduct?.id ?? "new"}:${resetCount}`,
    mainInputRef,
    galleryInputRef,
    startEditing,
    reset,
    selectMainFile,
    selectGalleryFiles,
    removeExistingGalleryImage,
    removeNewGalleryFile,
  };
}
