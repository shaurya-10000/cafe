import {
  DEFAULT_AUTO_SCROLL_SPEED,
  MAX_AUTO_SCROLL_SPEED,
} from "../constants";
import type { Testimonial } from "../types";
import { clampRating } from "./ratings";

/**
 * Makes untrusted CMS/API data safe to render: unique non-empty ids, clamped
 * ratings, trimmed strings and sensible fallbacks.
 */
export function normalizeTestimonials(
  testimonials: readonly Testimonial[],
): Testimonial[] {
  const seenIds = new Set<string>();

  return testimonials.map((testimonial, index) => {
    const rawId = typeof testimonial.id === "string" ? testimonial.id : "";

    let id = rawId.trim();

    if (!id || seenIds.has(id)) {
      id = `testimonial-${index}`;
    }

    while (seenIds.has(id)) {
      id = `testimonial-${index}-${seenIds.size}`;
    }

    seenIds.add(id);

    return {
      id,
      rating: clampRating(testimonial.rating),
      name:
        typeof testimonial.name === "string" && testimonial.name.trim()
          ? testimonial.name.trim()
          : "Anonymous",
      text:
        typeof testimonial.text === "string" && testimonial.text.trim()
          ? testimonial.text.trim()
          : "No review provided.",
      date:
        typeof testimonial.date === "string" ? testimonial.date.trim() : "",
    };
  });
}

export function sanitizeAutoScrollSpeed(speed: number): number {
  if (!Number.isFinite(speed)) {
    return DEFAULT_AUTO_SCROLL_SPEED;
  }

  return Math.min(MAX_AUTO_SCROLL_SPEED, Math.max(0, speed));
}
