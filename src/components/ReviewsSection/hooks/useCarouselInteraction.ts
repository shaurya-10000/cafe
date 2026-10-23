import {
  useCallback,
  useState,
  type FocusEvent,
  type RefObject,
} from "react";

interface UseCarouselInteractionOptions {
  /** The scrolling region (owned by the caller, which attaches it to the DOM). */
  regionRef: RefObject<HTMLElement | null>;
  /** The Prev/Play/Next cluster. */
  controlsRef: RefObject<HTMLElement | null>;
}

export interface UseCarouselInteractionResult {
  isPaused: boolean;
  /** Auto-scroll must stop: paused, hovered, focused or being dragged. */
  isSuspended: boolean;
  togglePaused: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  startDrag: () => void;
  endDrag: () => void;
}

/**
 * Tracks every reason the marquee should not auto-advance.
 *
 * The refs are created by the component and passed in, so the returned object
 * holds only state and handlers (reading `interaction.isPaused` during render
 * is then plainly safe, instead of looking like a ref access).
 */
export function useCarouselInteraction({
  regionRef,
  controlsRef,
}: UseCarouselInteractionOptions): UseCarouselInteractionResult {
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const togglePaused = useCallback(() => setIsPaused((value) => !value), []);
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);
  const onFocus = useCallback(() => setIsFocused(true), []);
  const startDrag = useCallback(() => setIsDragging(true), []);
  const endDrag = useCallback(() => setIsDragging(false), []);

  const onBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null;

      // Focus only leaves the carousel's interactive cluster if it is not
      // moving to the controls (Prev/Play/Next) or the region itself.
      // Otherwise auto-scroll would resume between tab stops.
      if (
        next &&
        (controlsRef.current?.contains(next) ||
          regionRef.current?.contains(next))
      ) {
        return;
      }

      setIsFocused(false);
    },
    [controlsRef, regionRef],
  );

  return {
    isPaused,
    isSuspended: isPaused || isHovered || isFocused || isDragging,
    togglePaused,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    startDrag,
    endDrag,
  };
}