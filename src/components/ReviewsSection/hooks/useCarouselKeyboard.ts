import { useCallback, type KeyboardEvent } from "react";

interface UseCarouselKeyboardOptions {
  canScroll: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onHome: () => void;
  onEnd: () => void;
}

export function useCarouselKeyboard({
  canScroll,
  onPrevious,
  onNext,
  onHome,
  onEnd,
}: UseCarouselKeyboardOptions): (event: KeyboardEvent<HTMLElement>) => void {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!canScroll) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          onPrevious();
          break;

        case "ArrowRight":
          event.preventDefault();
          onNext();
          break;

        case "Home":
          event.preventDefault();
          onHome();
          break;

        case "End":
          event.preventDefault();
          onEnd();
          break;

        default:
          break;
      }
    },
    [canScroll, onEnd, onHome, onNext, onPrevious],
  );
}
