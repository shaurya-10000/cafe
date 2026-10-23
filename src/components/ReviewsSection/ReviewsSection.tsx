"use client";

import { useCallback, useId, useMemo, useRef } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import { AverageRatingBadge } from "./components/AverageRatingBadge";
import { CarouselControls } from "./components/CarouselControls";
import { CarouselLiveRegion } from "./components/CarouselLiveRegion";
import { ReviewsHeading } from "./components/ReviewsHeading";
import { TestimonialMarquee } from "./components/TestimonialMarquee";
import { DEFAULT_AUTO_SCROLL_SPEED, SECTION_ID } from "./constants";
import { DEFAULT_TESTIMONIALS } from "./data/defaultTestimonials";
import { useCarouselInteraction } from "./hooks/useCarouselInteraction";
import { useCarouselKeyboard } from "./hooks/useCarouselKeyboard";
import { useInertAttribute, useInertSupport } from "./hooks/useInert";
import { useMarquee } from "./hooks/useMarquee";
import {
  normalizeTestimonials,
  sanitizeAutoScrollSpeed,
} from "./lib/normalize";
import { calculateAverageRating } from "./lib/ratings";
import { getContainerVariants, getItemVariants } from "./lib/variants";
import type { ReviewsSectionProps } from "./types";

const PASSIVE_DUPLICATE_STYLE = { pointerEvents: "none" } as const;

export default function ReviewsSection({
  testimonials = DEFAULT_TESTIMONIALS,
  autoScrollSpeed = DEFAULT_AUTO_SCROLL_SPEED,
}: ReviewsSectionProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const baseId = useId();
  const labelId = `${baseId}-label`;
  const descriptionId = `${baseId}-description`;

  /* ---- Data -------------------------------------------------------------- */

  const normalizedTestimonials = useMemo(
    () => normalizeTestimonials(testimonials),
    [testimonials],
  );

  const totalCount = normalizedTestimonials.length;

  const averageRating = useMemo(
    () => calculateAverageRating(normalizedTestimonials),
    [normalizedTestimonials],
  );

  const safeAutoScrollSpeed = useMemo(
    () => sanitizeAutoScrollSpeed(autoScrollSpeed),
    [autoScrollSpeed],
  );

  /* ---- Carousel ---------------------------------------------------------- */

  const regionRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const interaction = useCarouselInteraction({ regionRef, controlsRef });

  const marquee = useMarquee({
    itemCount: totalCount,
    autoScrollSpeed: safeAutoScrollSpeed,
    shouldReduceMotion,
    isSuspended: interaction.isSuspended,
  });

  const duplicateSetRef = useRef<HTMLDivElement>(null);
  const inertSupported = useInertSupport();

  useInertAttribute(duplicateSetRef, inertSupported, totalCount);

  const handleKeyDown = useCarouselKeyboard({
    canScroll: marquee.canScroll,
    onPrevious: marquee.previous,
    onNext: marquee.next,
    onHome: marquee.home,
    onEnd: marquee.end,
  });

  const { endDrag } = interaction;
  const { normalizePosition } = marquee;

  const handleDragEnd = useCallback(() => {
    endDrag();
    normalizePosition();
  }, [endDrag, normalizePosition]);

  /* ---- Motion ------------------------------------------------------------ */

  const containerVariants = useMemo(
    () => getContainerVariants(shouldReduceMotion),
    [shouldReduceMotion],
  );

  const itemVariants = useMemo(
    () => getItemVariants(shouldReduceMotion),
    [shouldReduceMotion],
  );

  /* ---- Empty state ------------------------------------------------------- */

  if (totalCount === 0) {
    return null;
  }

  return (
    <section
      id={SECTION_ID}
      aria-labelledby={labelId}
      className={cn(
        "overflow-hidden border-t border-cafe-border",
        "bg-cafe-bg py-24",
      )}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mx-auto max-w-7xl space-y-16 px-6"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between gap-8 md:flex-row md:items-end"
        >
          <ReviewsHeading labelId={labelId} descriptionId={descriptionId} />

          <div
            ref={controlsRef}
            onFocus={interaction.onFocus}
            onBlur={interaction.onBlur}
            className="flex flex-wrap items-center gap-4"
          >
            <AverageRatingBadge averageRating={averageRating} />

            {totalCount > 1 && (
              <CarouselControls
                canScroll={marquee.canScroll}
                isPaused={interaction.isPaused}
                onPrevious={marquee.previous}
                onNext={marquee.next}
                onTogglePause={interaction.togglePaused}
              />
            )}
          </div>
        </motion.div>
      </motion.div>

      <CarouselLiveRegion activeIndex={marquee.activeIndex} total={totalCount} />

      <TestimonialMarquee
        testimonials={normalizedTestimonials}
        describedBy={descriptionId}
        x={marquee.x}
        regionRef={regionRef}
        firstSetRef={marquee.firstSetRef}
        duplicateSetRef={duplicateSetRef}
        dragEnabled={!shouldReduceMotion && marquee.canScroll}
        duplicateStyle={inertSupported ? undefined : PASSIVE_DUPLICATE_STYLE}
        onMouseEnter={interaction.onMouseEnter}
        onMouseLeave={interaction.onMouseLeave}
        onFocus={interaction.onFocus}
        onBlur={interaction.onBlur}
        onKeyDown={handleKeyDown}
        onDragStart={interaction.startDrag}
        onDragEnd={handleDragEnd}
      />
    </section>
  );
}
