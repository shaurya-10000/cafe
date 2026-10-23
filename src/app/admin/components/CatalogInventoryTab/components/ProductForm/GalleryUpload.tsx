import { memo, type RefObject } from "react";

import { Upload, X } from "lucide-react";

import { CATALOG_MAX_GALLERY_IMAGES } from "@/types/catalog";

interface GalleryUploadProps {
  inputRef: RefObject<HTMLInputElement | null>;
  existingUrls: readonly string[];
  newPreviews: readonly string[];
  onSelect: (files: File[]) => void;
  onRemoveExisting: (url: string) => void;
  onRemoveNew: (index: number) => void;
}

const REMOVE_BUTTON_CLASS =
  "absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

export const GalleryUpload = memo(function GalleryUpload({
  inputRef,
  existingUrls,
  newPreviews,
  onSelect,
  onRemoveExisting,
  onRemoveNew,
}: GalleryUploadProps) {
  const hasImages = existingUrls.length > 0 || newPreviews.length > 0;
  const count = existingUrls.length + newPreviews.length;

  return (
    <div className="rounded-2xl border border-cafe-border bg-cafe-fg/[0.02] p-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload size={16} className="text-gray-500" aria-hidden="true" />

            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              Gallery (Max {CATALOG_MAX_GALLERY_IMAGES})
            </span>
          </div>

          <span className="font-mono text-[9px] text-blue-500">
            {count}/{CATALOG_MAX_GALLERY_IMAGES}
          </span>
        </div>
      </button>

      <input
        type="file"
        ref={inputRef}
        onChange={(event) => onSelect(Array.from(event.target.files || []))}
        multiple
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {hasImages && (
        <div className="mt-3 flex flex-wrap gap-2">
          {existingUrls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-12 w-12 rounded-xl border border-cafe-border object-cover"
              />

              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                aria-label="Remove image"
                className={REMOVE_BUTTON_CLASS}
              >
                <X size={10} aria-hidden="true" />
              </button>
            </div>
          ))}

          {newPreviews.map((src, index) => (
            <div key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-12 w-12 rounded-xl border border-blue-400 object-cover"
              />

              <button
                type="button"
                onClick={() => onRemoveNew(index)}
                aria-label="Remove image"
                className={REMOVE_BUTTON_CLASS}
              >
                <X size={10} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
