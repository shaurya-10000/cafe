import { memo } from "react";

import { ImageIcon, Loader2 } from "lucide-react";

import { cx } from "../../lib/cx";
import { LEGEND_CLASS } from "../../styles";
import type { UseLocationImageResult } from "../../hooks/useLocationImage";

interface MediaFieldProps {
  image: UseLocationImageResult;
}

export const MediaField = memo(function MediaField({ image }: MediaFieldProps) {
  const { inputRef, imageUrl, fileName, isUploading, select, remove } = image;

  return (
    <fieldset className="space-y-3">
      <legend className={LEGEND_CLASS}>Media</legend>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cx(
          "flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-6 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
          imageUrl
            ? "border-cafe-accent/40 bg-cafe-accent/5"
            : "border-cafe-border hover:bg-cafe-fg/[0.02]",
        )}
      >
        {isUploading ? (
          <Loader2
            size={22}
            className="animate-spin text-cafe-accent"
            aria-hidden="true"
          />
        ) : (
          <ImageIcon
            size={22}
            className={imageUrl ? "text-cafe-accent" : "text-gray-500"}
            aria-hidden="true"
          />
        )}

        <p className="text-center text-[9px] font-black uppercase text-cafe-fg">
          {isUploading
            ? "Uploading..."
            : (fileName ??
              (imageUrl
                ? "Change Location Photo"
                : "Location Photo (JPEG/PNG/WebP, max 5MB)"))}
        </p>
      </button>

      <input
        type="file"
        ref={inputRef}
        onChange={(event) => void select(event.target.files?.[0] ?? null)}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {imageUrl && !isUploading && (
        <button
          type="button"
          onClick={remove}
          className="w-full py-1 text-center text-[9px] font-bold uppercase tracking-widest text-red-400/80 transition-colors hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Remove Photo
        </button>
      )}
    </fieldset>
  );
});
