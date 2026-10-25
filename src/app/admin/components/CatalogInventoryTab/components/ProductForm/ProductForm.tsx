import type { FormEventHandler } from "react";

import { Edit3, PlusCircle } from "lucide-react";

import type { UseCatalogFormResult } from "../../hooks/useCatalogForm";
import { BasicFields } from "./BasicFields";
import { FileErrorAlert } from "./FileErrorAlert";
import { FormActions } from "./FormActions";
import { GalleryUpload } from "./GalleryUpload";
import { MainImageUpload } from "./MainImageUpload";
import { TypeFields } from "./TypeFields";
import { VisibilityToggles } from "./VisibilityToggles";

interface ProductFormProps {
  form: UseCatalogFormResult;
  submitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function ProductForm({ form, submitting, onSubmit }: ProductFormProps) {
  const { editingProduct } = form;
  const isEditing = editingProduct !== null;

  return (
    <div className="sticky top-8 rounded-[2.5rem] border border-cafe-border bg-cafe-card p-6 md:p-8">
      <h2 className="mb-8 flex items-center gap-3 text-xl font-semibold text-cafe-fg">
        {isEditing ? (
          <Edit3 size={22} className="text-cafe-accent" aria-hidden="true" />
        ) : (
          <PlusCircle size={22} className="text-cafe-accent" aria-hidden="true" />
        )}

        {isEditing ? "Update Item" : "New Item"}
      </h2>

      {/*
        The text inputs are uncontrolled; `formKey` remounts the form when a
        different item is picked and after every reset.
      */}
      <form key={form.formKey} onSubmit={onSubmit} className="space-y-4">
        <BasicFields product={editingProduct} />

        <TypeFields
          itemType={form.itemType}
          product={editingProduct}
          onItemTypeChange={form.setItemType}
        />

        <VisibilityToggles product={editingProduct} />

        <MainImageUpload
          inputRef={form.mainInputRef}
          file={form.mainFile}
          preview={form.mainPreview}
          existingUrl={editingProduct?.media?.[0] ?? null}
          isEditing={isEditing}
          onSelect={form.selectMainFile}
        />

        <GalleryUpload
          inputRef={form.galleryInputRef}
          existingUrls={form.existingGalleryUrls}
          newPreviews={form.galleryPreviews}
          onSelect={form.selectGalleryFiles}
          onRemoveExisting={form.removeExistingGalleryImage}
          onRemoveNew={form.removeNewGalleryFile}
        />

        {form.fileError && <FileErrorAlert message={form.fileError} />}

        <FormActions
          isEditing={isEditing}
          submitting={submitting}
          disabled={submitting || !!form.fileError}
          onCancel={form.reset}
        />
      </form>
    </div>
  );
}
