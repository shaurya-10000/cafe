import { cn } from "@/lib/utils";

/** Decorative blurred blobs behind the footer content. */
export function FooterBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-40 -top-40",
          "size-[24rem] rounded-full",
          "bg-cafe-accent/5 blur-2xl",
          "transform-gpu",
          "sm:size-[32rem] sm:blur-3xl",
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -left-40 bottom-0",
          "size-[18rem] rounded-full",
          "bg-cafe-fg/[0.025] blur-2xl",
          "transform-gpu",
          "sm:size-[24rem] sm:blur-3xl",
        )}
      />
    </>
  );
}
