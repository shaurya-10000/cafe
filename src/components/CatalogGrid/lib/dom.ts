/** Finds a rendered card by its `data-item-id` attribute. */
export function findCardElement(
  container: HTMLElement | null,
  itemId: string,
): HTMLElement | null {
  if (!container) return null;

  const cards = container.querySelectorAll<HTMLElement>("[data-item-id]");

  for (const card of cards) {
    if (card.dataset.itemId === itemId) return card;
  }

  return null;
}
