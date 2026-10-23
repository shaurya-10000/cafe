import { memo, type RefObject } from "react";

import { ImageIcon } from "lucide-react";

import { cx } from "../../lib/cx";

interface MainImageUploadProps {
  inputRef: RefObject<HTMLInputElement | null>;
  file: File | null;
  /** Object URL of the newly chosen file. */
  preview: string | null;
  /** The image already stored on the item being edited. */
  existingUrl: string | null;
  isEditing: boolean;
  onSelect: (file: File | null) => void;
}

export const MainImageUpload = memo(function MainImageUpload({
  inputRef,
  file,
  preview,
  existingUrl,
  isEditing,
  onSelect,
}: MainImageUploadProps) {
  const imageSrc = preview || existingUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cx(
          "flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-6 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          file || existingUrl
            ? "border-blue-500/40 bg-blue-500/5"
            : "border-cafe-border hover:bg-cafe-fg/[0.02]",
        )}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Background preview"
            className="h-28 w-full rounded-2xl object-cover"
          />
        ) : (
          <ImageIcon size={22} className="text-gray-500" aria-hidden="true" />
        )}

        <p className="text-center text-[9px] font-black uppercase text-cafe-fg">
          {file
            ? file.name
            : isEditing
              ? "Change Background"
              : "Mandatory Background"}
        </p>
      </button>

      <input
        type="file"
        ref={inputRef}
        onChange={(event) => onSelect(event.target.files?.[0] || null)}
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
});
