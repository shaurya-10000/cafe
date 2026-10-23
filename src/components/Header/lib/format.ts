export function formatBadgeCount(count: number, max = 9): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  if (!Number.isFinite(max) || max <= 0) return null;
  return count > max ? `${max}+` : String(count);
}
