type Axis = "horizontal" | "vertical";

/**
 * Next index for a roving-focus list, wrapping at both ends. Returns null
 * when the key is not one this axis handles.
 */
export function getNextIndex(
  key: string,
  current: number,
  count: number,
  axis: Axis,
): number | null {
  if (count <= 0) return null;

  const forward = axis === "horizontal" ? "ArrowRight" : "ArrowDown";
  const backward = axis === "horizontal" ? "ArrowLeft" : "ArrowUp";

  switch (key) {
    case forward:
      return (current + 1) % count;
    case backward:
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
