import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { deleteImageBestEffort, uploadImage } from "../api/images";
import { validateLocationImage } from "../lib/images";
import type { UseBannerResult } from "./useBanner";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseLocationImageOptions {
  banner: Pick<UseBannerResult, "showError" | "clearBanner">;
  /** Called when the image changes, so the form can be marked dirty. */
  onDirty: () => void;
}

export interface UseLocationImageResult {
  inputRef: RefObject<HTMLInputElement | null>;
  imageUrl: string | null;
  fileName: string | null;
  isUploading: boolean;
  /** Start from a location's saved image (or none for a new location). */
  load: (location: { imageUrl: string | null } | null) => void;
  select: (file: File | null) => Promise<void>;
  remove: () => void;
  /**
   * Call after a successful save with the image URL that was saved: deletes
   * the previous image and any uploads that were replaced along the way.
   */
  commitSaved: (savedUrl: string | null) => void;
}

/**
 * Image lifecycle for the location form.
 *
 * Uploads happen immediately on selection, but the location row only
 * references an image once the form is saved. So the hook tracks:
 *   - `originalUrl`: the image the location already has in the database;
 *   - `pendingUrls`: files uploaded during this editing session.
 *
 * A pending file nobody saved is deleted right away (replaced/removed) or
 * when editing is abandoned. The *original* image is only deleted after a
 * save that no longer references it, never earlier, so cancelling an edit
 * can never leave the location pointing at a deleted file.
 */
export function useLocationImage({
  banner,
  onDirty,
}: UseLocationImageOptions): UseLocationImageResult {
  const isMounted = useIsMounted();
  const { showError, clearBanner } = banner;

  const inputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imageUrlRef = useLatestRef(imageUrl);
  const onDirtyRef = useLatestRef(onDirty);

  const originalUrlRef = useRef<string | null>(null);
  const pendingUrlsRef = useRef<Set<string>>(new Set());

  const clearInput = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const discardPending = useCallback(() => {
    const urls = Array.from(pendingUrlsRef.current);
    pendingUrlsRef.current.clear();

    for (const url of urls) void deleteImageBestEffort(url);
  }, []);

  // Abandoning the tab with unsaved uploads must not leave orphans behind.
  useEffect(() => discardPending, [discardPending]);

  const load = useCallback(
    (location: { imageUrl: string | null } | null) => {
      discardPending();

      originalUrlRef.current = location?.imageUrl ?? null;

      setImageUrl(location?.imageUrl ?? null);
      setFileName(null);
      clearInput();
    },
    [clearInput, discardPending],
  );

  const select = useCallback(
    async (file: File | null): Promise<void> => {
      if (!file) return;

      clearBanner();

      const validationError = validateLocationImage(file);

      if (validationError) {
        showError(validationError);
        clearInput();
        return;
      }

      setFileName(file.name);
      setIsUploading(true);

      const result = await uploadImage(file);

      if (!isMounted()) {
        if (result.success) void deleteImageBestEffort(result.url);
        return;
      }

      setIsUploading(false);

      if (!result.success) {
        showError(result.error);
        clearInput();
        setFileName(null);
        return;
      }

      // Replacing an unsaved upload: the previous one is now unreferenced.
      const previous = imageUrlRef.current;

      if (previous && pendingUrlsRef.current.has(previous)) {
        pendingUrlsRef.current.delete(previous);
        void deleteImageBestEffort(previous);
      }

      pendingUrlsRef.current.add(result.url);

      setImageUrl(result.url);
      onDirtyRef.current();
    },
    [clearBanner, clearInput, imageUrlRef, isMounted, onDirtyRef, showError],
  );

  const remove = useCallback(() => {
    const url = imageUrlRef.current;

    setImageUrl(null);
    setFileName(null);
    clearInput();
    onDirtyRef.current();

    // Only an unsaved upload can be deleted now. The saved image stays in
    // storage until a save actually drops it (see `commitSaved`).
    if (url && pendingUrlsRef.current.has(url)) {
      pendingUrlsRef.current.delete(url);
      void deleteImageBestEffort(url);
    }
  }, [clearInput, imageUrlRef, onDirtyRef]);

  const commitSaved = useCallback((savedUrl: string | null) => {
    const obsolete: string[] = [];

    const original = originalUrlRef.current;

    if (original && original !== savedUrl) obsolete.push(original);

    for (const pending of pendingUrlsRef.current) {
      if (pending !== savedUrl) obsolete.push(pending);
    }

    pendingUrlsRef.current.clear();
    originalUrlRef.current = savedUrl;

    for (const url of obsolete) void deleteImageBestEffort(url);
  }, []);

  return {
    inputRef,
    imageUrl,
    fileName,
    isUploading,
    load,
    select,
    remove,
    commitSaved,
  };
}
