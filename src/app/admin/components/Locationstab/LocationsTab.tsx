"use client";

import { useCallback, useMemo } from "react";

import { LocationForm } from "./components/LocationForm/LocationForm";
import { LocationList } from "./components/LocationList";
import { LocationsHeader } from "./components/LocationsHeader";
import { StatusBanner } from "./components/StatusBanner";
import { useAiLocationActions } from "./hooks/useAiLocationActions";
import { useBanner } from "./hooks/useBanner";
import { useLocationActions } from "./hooks/useLocationActions";
import { useLocationEditor } from "./hooks/useLocationEditor";
import { splitLocations } from "./lib/locations";
import type { AdminLocation, LocationsTabProps } from "./types";

export function LocationsTab({ initialLocations }: LocationsTabProps) {
  const banner = useBanner();
  const editor = useLocationEditor({ banner });

  const { reset: resetEditor, commitSaved } = editor;

  const handleSaved = useCallback(
    (savedImageUrl: string | null) => {
      // Drop images the save made obsolete, then return to an empty form.
      commitSaved(savedImageUrl);
      resetEditor(null);
    },
    [commitSaved, resetEditor],
  );

  const handleResetEditor = useCallback(() => resetEditor(null), [resetEditor]);

  const actions = useLocationActions({
    banner,
    editingLocationId: editor.editingLocation?.id,
    onResetEditor: handleResetEditor,
    setFieldErrors: editor.setFieldErrors,
    onSaved: handleSaved,
  });

  const { submit, toggleActive, remove, reorder } = actions;

  // AI concierge: "deactivate the downtown branch".
  useAiLocationActions({ locations: initialLocations, toggleActive });

  const counts = useMemo(() => {
    const { active, inactive } = splitLocations(initialLocations);

    return { active: active.length, inactive: inactive.length };
  }, [initialLocations]);

  const busy = actions.isBusy || editor.image.isUploading;

  const handleSubmit = useCallback(
    (formData: FormData) => {
      void submit(formData, {
        editingLocation: editor.editingLocation,
        imageUrl: editor.image.imageUrl,
      });
    },
    [editor.editingLocation, editor.image.imageUrl, submit],
  );

  const handleToggle = useCallback(
    (location: AdminLocation) => {
      void toggleActive(location);
    },
    [toggleActive],
  );

  const handleDelete = useCallback(
    (location: AdminLocation) => {
      void remove(location);
    },
    [remove],
  );

  const handleReorder = useCallback(
    (location: AdminLocation, direction: "up" | "down") => {
      void reorder(location, direction);
    },
    [reorder],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <LocationsHeader
        activeCount={counts.active}
        inactiveCount={counts.inactive}
      />

      {banner.banner && (
        <StatusBanner banner={banner.banner} onDismiss={banner.clearBanner} />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-7 xl:col-span-8">
          <LocationList
            locations={initialLocations}
            pending={actions.pending}
            busy={busy}
            onEdit={resetEditor}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
          <LocationForm
            editor={editor}
            isSaving={actions.pending?.kind === "save"}
            busy={busy}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
