import type { CartItem } from "@/lib/domain/cart";

/** Lower-case, accent-free, single-spaced: "Éclairs " and "eclairs" compare equal. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "lattes" -> "latte". Applied to both sides, which is enough for menu names. */
function singular(value: string): string {
  return value.length > 3 && value.endsWith("s") ? value.slice(0, -1) : value;
}

/**
 * Finds the cart line an AI action refers to: by id first, then by name.
 * The name fallback keeps an action working when the model's id is wrong.
 */
export function findCartLine(
  items: readonly CartItem[],
  itemId?: string,
  itemName?: string,
): CartItem | undefined {
  if (itemId) {
    const byId = items.find((item) => item.id === itemId);
    if (byId) return byId;
  }

  if (!itemName) return undefined;

  const wanted = normalize(itemName);
  if (!wanted) return undefined;

  const exact = items.find((item) => normalize(item.name) === wanted);
  if (exact) return exact;

  const wantedSingular = singular(wanted);
  return items.find(
    (item) => singular(normalize(item.name)) === wantedSingular,
  );
}
