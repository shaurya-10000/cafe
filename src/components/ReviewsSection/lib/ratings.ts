import { STAR_COUNT } from "../constants";
import type { Testimonial } from "../types";

/** Normalize an external rating into the supported integer 0-5 range. */
export function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) {
    return STAR_COUNT;
  }

  return Math.min(STAR_COUNT, Math.max(0, Math.round(rating)));
}

/** Calculate the display average using the same normalization as rendering. */
export function calculateAverageRating(
  testimonials: readonly Testimonial[],
): string {
  if (testimonials.length === 0) {
    return "0.0";
  }

  const total = testimonials.reduce(
    (sum, testimonial) => sum + clampRating(testimonial.rating),
    0,
  );

  return (total / testimonials.length).toFixed(1);
}
