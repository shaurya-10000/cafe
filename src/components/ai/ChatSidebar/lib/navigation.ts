/**
 * Next focus index for a listbox key press, or null when the key isn't a
 * navigation key. Wraps at both ends (standard listbox behavior): a hard
 * stop forces the user to remember where they are, and the list is short.
 */
export function getNextSessionIndex(
  key: string,
  currentIndex: number,
  length: number,
): number | null {
  switch (key) {
    case "ArrowDown":
      return (currentIndex + 1) % length;
    case "ArrowUp":
      return (currentIndex - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return null;
  }
}