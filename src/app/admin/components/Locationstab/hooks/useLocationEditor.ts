import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { AdminLocation, FieldErrors } from "../types";
import type { UseBannerResult } from "./useBanner";
import { useLocationImage, type UseLocationImageResult } from "./useLocationImage";

interface UseLocationEditorOptions {
  banner: Pick<UseBannerResult, "showError" | "clearBanner">;
}

export interface UseLocationEditorResult {
  /** The location being edited, or `null` when creating a new one. */
  editingLocation: AdminLocation | null;
  fieldErrors: FieldErrors;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  isDirty: boolean;
  markDirty: () => void;
  /** Changes whenever the uncontrolled form must start from scratch. */
  formKey: string;
  image: UseLocationImageResult;
  /** Edit a location, or pass `null` to go back to an empty "new" form. */
  reset: (location: AdminLocation | null) => void;
  /** Call after a successful save with the image URL that was saved. */
  commitSaved: (savedImageUrl: string | null) => void;
}

/**
 * Form-level state for the location form: what is being edited, validation
 * errors, the dirty flag and the image lifecycle.
 *
 * The inputs are uncontrolled (read from FormData on submit), so starting
 * over means remounting the form: `formKey` changes when a different
 * location is picked and after every reset to "new", which also clears the
 * fields after a successful create.
 */
export function useLocationEditor({
  banner,
}: UseLocationEditorOptions): UseLocationEditorResult {
  const [editingLocation, setEditingLocation] = useState<AdminLocation | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const image = useLocationImage({ banner, onDirty: markDirty });

  const { load: loadImage, commitSaved: commitImage } = image;

  // Warn on navigation with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);

    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const reset = useCallback(
    (location: AdminLocation | null) => {
      setEditingLocation(location);
      setFieldErrors({});
      setIsDirty(false);
      loadImage(location);

      if (location === null) setResetCount((count) => count + 1);
    },
    [loadImage],
  );

  const commitSaved = useCallback(
    (savedImageUrl: string | null) => commitImage(savedImageUrl),
    [commitImage],
  );

  return {
    editingLocation,
    fieldErrors,
    setFieldErrors,
    isDirty,
    markDirty,
    formKey: `${editingLocation?.id ?? "new"}:${resetCount}`,
    image,
    reset,
    commitSaved,
  };
}
