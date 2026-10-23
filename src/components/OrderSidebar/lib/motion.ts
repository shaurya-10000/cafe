export function getViewSlide(side: "left" | "right", reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }

  const offset = side === "left" ? -20 : 20;

  return {
    initial: { x: offset, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: offset, opacity: 0 },
  };
}

export function getViewTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.2 };
}

export function getPanelTransition(reducedMotion: boolean) {
  return reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, damping: 30, stiffness: 300 };
}
