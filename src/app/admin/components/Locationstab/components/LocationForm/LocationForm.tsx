import type { FormEvent } from "react";

import { Edit3, Plus } from "lucide-react";

import type { UseLocationEditorResult } from "../../hooks/useLocationEditor";
import { AddressFields } from "./AddressFields";
import { CapacityFields } from "./CapacityFields";
import { FormActions } from "./FormActions";
import { GeneralFields } from "./GeneralFields";
import { HoursFields } from "./HoursFields";
import { MediaField } from "./MediaField";
import { firstError } from "../../lib/fieldErrors";

interface LocationFormProps {
  editor: UseLocationEditorResult;
  isSaving: boolean;
  busy: boolean;
  onSubmit: (formData: FormData) => void;
}

export function LocationForm({
  editor,
  isSaving,
  busy,
  onSubmit,
}: LocationFormProps) {
  const { editingLocation, fieldErrors } = editor;
  const isEditing = editingLocation !== null;

  // `onSubmit` (not a React form `action`) on purpose: a form action resets
  // the uncontrolled fields as soon as it returns, which would wipe what the
  // user typed before the server has validated it.
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  };

  return (
    <div className="sticky top-8 space-y-8 rounded-[2.5rem] border border-cafe-border bg-cafe-card p-6 md:p-8">
      <h2 className="flex items-center gap-3 text-xl font-semibold text-cafe-fg">
        {isEditing ? (
          <Edit3 size={22} className="text-blue-400" aria-hidden="true" />
        ) : (
          <Plus size={22} className="text-blue-500" aria-hidden="true" />
        )}

        {isEditing ? "Update Location" : "New Location"}
      </h2>

      {/*
        The inputs are uncontrolled; `formKey` remounts the form when a
        different location is picked and after every reset to "new".
      */}
      <form
        key={editor.formKey}
        onSubmit={handleSubmit}
        onChange={editor.markDirty}
        className="space-y-8"
      >
        <GeneralFields
          location={editingLocation}
          nameError={firstError(fieldErrors, "name")}
        />

        <AddressFields location={editingLocation} fieldErrors={fieldErrors} />

        <HoursFields location={editingLocation} fieldErrors={fieldErrors} />

        <CapacityFields location={editingLocation} fieldErrors={fieldErrors} />

        <MediaField image={editor.image} />

        <FormActions
          isEditing={isEditing}
          isSaving={isSaving}
          busy={busy}
          onCancel={() => editor.reset(null)}
        />
      </form>
    </div>
  );
}
