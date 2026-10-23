import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import {
  createOrUpdateLocation,
  deleteLocation,
  reorderLocation,
  setLocationActive,
} from "@/app/admin/actions/LocationActions";

import { BUSY_MESSAGE, GENERIC_ERROR_MESSAGE } from "../constants";
import type {
  AdminLocation,
  FieldErrors,
  PendingAction,
  ReorderDirection,
} from "../types";
import type { UseBannerResult } from "./useBanner";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface SubmitContext {
  editingLocation: AdminLocation | null;
  imageUrl: string | null;
}

interface UseLocationActionsOptions {
  banner: UseBannerResult;
  /** Id of the location open in the form, if any. */
  editingLocationId: string | undefined;
  /** Back to an empty form (called when the edited row is toggled/deleted). */
  onResetEditor: () => void;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  /** Called after a successful save with the image URL that was saved. */
  onSaved: (savedImageUrl: string | null) => void;
}

export interface UseLocationActionsResult {
  pending: PendingAction | null;
  isBusy: boolean;
  submit: (formData: FormData, context: SubmitContext) => Promise<void>;
  toggleActive: (
    location: AdminLocation,
    options?: { confirm?: boolean },
  ) => Promise<void>;
  remove: (location: AdminLocation) => Promise<void>;
  reorder: (
    location: AdminLocation,
    direction: ReorderDirection,
  ) => Promise<void>;
}

/**
 * Every mutation of the location network. One runs at a time; each reports
 * its outcome the same way, and a thrown error (network) can never leave a
 * spinner stuck.
 */
export function useLocationActions({
  banner,
  editingLocationId,
  onResetEditor,
  setFieldErrors,
  onSaved,
}: UseLocationActionsOptions): UseLocationActionsResult {
  const router = useRouter();
  const isMounted = useIsMounted();

  const { showError, showSuccess, clearBanner } = banner;

  const editingIdRef = useLatestRef(editingLocationId);
  const onResetEditorRef = useLatestRef(onResetEditor);
  const onSavedRef = useLatestRef(onSaved);

  const [pending, setPending] = useState<PendingAction | null>(null);
  const inFlightRef = useRef(false);

  /** Runs `task` unless another action is in flight; returns whether it ran. */
  const run = useCallback(
    async (action: PendingAction, task: () => Promise<void>): Promise<boolean> => {
      if (inFlightRef.current) return false;

      inFlightRef.current = true;
      setPending(action);

      try {
        await task();
      } catch (error) {
        console.error("[LocationsTab] action failed", action, error);

        if (isMounted()) showError(GENERIC_ERROR_MESSAGE);
      } finally {
        inFlightRef.current = false;

        if (isMounted()) setPending(null);
      }

      return true;
    },
    [isMounted, showError],
  );

  const submit = useCallback(
    async (formData: FormData, context: SubmitContext): Promise<void> => {
      clearBanner();
      setFieldErrors({});

      if (context.editingLocation) {
        formData.set("id", context.editingLocation.id);
      }

      if (context.imageUrl) formData.set("imageUrl", context.imageUrl);
      else formData.delete("imageUrl");

      await run({ kind: "save" }, async () => {
        const result = await createOrUpdateLocation(formData);

        if (!isMounted()) return;

        if (!result.success) {
          showError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }

        showSuccess(
          context.editingLocation ? "Location updated." : "Location created.",
        );

        onSavedRef.current(context.imageUrl);
        router.refresh();
      });
    },
    [clearBanner, isMounted, onSavedRef, router, run, setFieldErrors, showError, showSuccess],
  );

  const toggleActive = useCallback(
    async (
      location: AdminLocation,
      options: { confirm?: boolean } = {},
    ): Promise<void> => {
      const isDeactivating = location.isActive;

      // The confirm dialog is only for the human-driven button. The AI path
      // has already been confirmed once via the chat's Proceed button;
      // asking again would be annoying and could hang the AI flow on a
      // dialog the user wasn't expecting.
      if (
        options.confirm !== false &&
        isDeactivating &&
        !window.confirm(
          `Deactivate "${location.name}"? It will stop showing to customers immediately.`,
        )
      ) {
        return;
      }

      clearBanner();

      const ran = await run({ kind: "toggle", id: location.id }, async () => {
        const result = await setLocationActive(location.id, !isDeactivating);

        if (!isMounted()) return;

        if (!result.success) {
          showError(result.error);
          toast.error(result.error);
          return;
        }

        const message = isDeactivating
          ? "Location deactivated."
          : "Location reactivated.";

        showSuccess(message);
        toast.success(message);

        if (editingIdRef.current === location.id) onResetEditorRef.current();

        router.refresh();
      });

      if (!ran) toast.error(BUSY_MESSAGE);
    },
    [clearBanner, editingIdRef, isMounted, onResetEditorRef, router, run, showError, showSuccess],
  );

  const remove = useCallback(
    async (location: AdminLocation): Promise<void> => {
      if (
        !window.confirm(
          `Permanently delete "${location.name}"? This cannot be undone.`,
        )
      ) {
        return;
      }

      clearBanner();

      await run({ kind: "delete", id: location.id }, async () => {
        const result = await deleteLocation(location.id);

        if (!isMounted()) return;

        if (!result.success) {
          showError(result.error);
          return;
        }

        showSuccess("Location deleted.");

        if (editingIdRef.current === location.id) onResetEditorRef.current();

        router.refresh();
      });
    },
    [clearBanner, editingIdRef, isMounted, onResetEditorRef, router, run, showError, showSuccess],
  );

  const reorder = useCallback(
    async (
      location: AdminLocation,
      direction: ReorderDirection,
    ): Promise<void> => {
      clearBanner();

      await run({ kind: "reorder", id: location.id }, async () => {
        const result = await reorderLocation(location.id, direction);

        if (!isMounted()) return;

        if (!result.success) {
          showError(result.error);
          return;
        }

        router.refresh();
      });
    },
    [clearBanner, isMounted, router, run, showError],
  );

  return {
    pending,
    isBusy: pending !== null,
    submit,
    toggleActive,
    remove,
    reorder,
  };
}
